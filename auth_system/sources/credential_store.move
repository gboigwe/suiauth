// Copyright (c) 2025, SuiAuth Contributors
// SPDX-License-Identifier: MIT

/// @title Credential Store Module
/// @notice Manages verifiable credentials for SuiAuth identities
/// @dev Implements a flexible credential system with validation and verification
#[allow(unused_const)]
module auth_system::credential_store;

use sui::event;
use sui::dynamic_field as df;
use sui::clock::{Self, Clock};
use std::string::String;

use auth_system::identity_registry::{Self, Identity};

// ============ Error Codes ============
const ENotAuthorized: u64 = 1;
const EIdentityNotActive: u64 = 2;
const ECredentialNotFound: u64 = 3;
const ECredentialExpired: u64 = 4;
const EIssuerNotAuthorized: u64 = 5;
const EInvalidCredential: u64 = 6;

// ============ Types ============

/// @notice Capability for issues to create credentials
public struct IssuerCap has key, store {
    id: UID,
    /// Issuer name
    name: String,
    /// Domains this issuer can create credentials for
    domains: vector<String>,
    /// The address of the issuer
    issuer_address: address,
}

/// @notice Struct to track credential keys for an identity
public struct CredentialRegistry has store {
    keys: vector<CredentialKey>,
}

/// @notice Key for storing the credential registry in identity
public struct CredentialRegistryKey has copy, drop, store {}

/// @notice Type for credential keys
public struct CredentialKey has copy, drop, store {
    credential_type: String,
    issuer: address,
}

/// @notice Represents a verifiable credential
public struct Credential has key, store {
    id: UID,
    /// Type of credential (e.g., "KYC", "EmailVerification")
    credential_type: String,
    /// Who issued this credential
    issuer: address,
    /// Issuer name
    issuer_name: String,
    /// When this credential was issued
    issued_at: u64,
    /// When this credential expires (if applicable)
    expiration: Option<u64>,
    /// Credential data (can be encrypted or hashed)
    data: vector<u8>,
    /// Optional metadata (e.g., credential level, version)
    metadata: vector<u8>,
    /// Revocation status
    revoked: bool,
}

/// @notice Public info about a credential
public struct CredentialInfo has copy, drop, store {
    id: ID,
    credential_type: String,
    issuer: address,
    issuer_name: String,
    issued_at: u64,
    expiration: Option<u64>,
    metadata: vector<u8>,
    revoked: bool,
}

// ============ Evnets ============

/// @notice Emitted when an issuer capability is created
public struct IssuerCapCreated has copy, drop {
    issuer_cap_id: ID,
    issuer_name: String,
    issuer_address: address,
    domains: vector<String>,
    timestamp: u64,
}

/// @notice Emitted when a credential is issued
public struct CredentialIssued has copy, drop {
    credential_id: ID,
    identity_id: ID,
    credential_type: String,
    issuer: address,
    issuer_name: String,
    timestamp: u64,
}

/// @notice Emitted when a credential is revoked
public struct CredentialRevoked has copy, drop {
    credential_id: ID,
    identity_id: ID,
    timestamp: u64,
}

// ======== Issuer functions ========
    
/// @notice Create a new issuer capability
public entry fun create_issuer_cap(
    name: String,
    domains: vector<String>,
    clock: &Clock,
    ctx: &mut TxContext
) {
    let issuer_address = tx_context::sender(ctx);
    let cap_id = object::new(ctx);
    let issuer_cap_id = object::uid_to_inner(&cap_id);
    
    let issuer_cap = IssuerCap {
        id: cap_id,
        name,
        domains,
        issuer_address,
    };
    
    // Transfer the capability to the issuer
    transfer::transfer(issuer_cap, issuer_address);
    
    // Emit event
    let timestamp = clock::timestamp_ms(clock);
    event::emit(IssuerCapCreated {
        issuer_cap_id,
        issuer_name: name,
        issuer_address,
        domains,
        timestamp,
    });
}

/// @notice Check if an issuer can issue a certain credential type
public fun can_issue(
    issuer_cap: &IssuerCap,
    credential_type: &String
): bool {
    let domains = &issuer_cap.domains;
    let mut i = 0;
    let len = vector::length(domains);
    
    while (i < len) {
        if (vector::borrow(domains, i) == credential_type) {
            return true
        };
        i = i + 1;
    };
    
    false
}

// ======== Helper functions ========

/// @notice Get or create credential registry for an identity
public fun get_or_create_registry(identity_id: &mut UID): &mut CredentialRegistry {
    let registry_key = CredentialRegistryKey {};
    
    if (!df::exists_(identity_id, registry_key)) {
        let registry = CredentialRegistry {
            keys: vector::empty<CredentialKey>(),
        };
        df::add(identity_id, registry_key, registry);
    };
    
    df::borrow_mut(identity_id, registry_key)
}

/// @notice Add a credential key to the registry
public fun add_credential_key(registry: &mut CredentialRegistry, key: CredentialKey) {
    // Check if key already exists
    let mut i = 0;
    let len = vector::length(&registry.keys);
    while (i < len) {
        let existing_key = vector::borrow(&registry.keys, i);
        if (existing_key.credential_type == key.credential_type && 
            existing_key.issuer == key.issuer) {
            return // Key already exists
        };
        i = i + 1;
    };
    
    // Add new key
    vector::push_back(&mut registry.keys, key);
}

/// @notice Remove a credential key from the registry
public fun remove_credential_key(registry: &mut CredentialRegistry, key: CredentialKey) {
    let mut i = 0;
    let len = vector::length(&registry.keys);
    while (i < len) {
        let existing_key = vector::borrow(&registry.keys, i);
        if (existing_key.credential_type == key.credential_type && 
            existing_key.issuer == key.issuer) {
            vector::remove(&mut registry.keys, i);
            return
        };
        i = i + 1;
    };
}

// ======== Credential functions ========
    
/// @notice Issue a credential to an identity
public entry fun issue_credential(
    issuer_cap: &IssuerCap,
    identity: &mut Identity,
    credential_type: String,
    data: vector<u8>,
    metadata: vector<u8>,
    expiration: Option<u64>,
    clock: &Clock,
    ctx: &mut TxContext
) {
    // Verify the identity is active
    assert!(identity_registry::is_active(identity), EIdentityNotActive);
    
    // Verify the issuer is authorized to issue this type of credential
    assert!(can_issue(issuer_cap, &credential_type), EIssuerNotAuthorized);
    
    let credential_id = object::new(ctx);
    let credential_id_inner = object::uid_to_inner(&credential_id);

    let credential = Credential {
        id: credential_id,
        credential_type: credential_type,
        issuer: issuer_cap.issuer_address,                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          
        issuer_name: issuer_cap.name,
        issued_at: tx_context::epoch(ctx),
        expiration,
        data,
        metadata,
        revoked: false,
    };
    
    // Add the credential to the identity
    let key = CredentialKey {
        credential_type,
        issuer: issuer_cap.issuer_address,
    };
    
    // Get mutable reference to identity ID
    let identity_id_mut = identity_registry::id_mut(identity);
    
    // If a credential of the same type from the same issuer exists, replace it
    if (df::exists_(identity_id_mut, key)) {
        let old_credential: Credential = df::remove(identity_id_mut, key);
        let Credential { id, credential_type: _, issuer: _, issuer_name: _, 
                      issued_at: _, expiration: _, data: _, metadata: _, revoked: _ } = old_credential;
        object::delete(id);
    };
    
    // Add the new credential
    df::add(identity_id_mut, key, credential);

    // Get the identity ID for the event (after we're done with mutable operations)
    let identity_id_inner = object::uid_to_inner(identity_id_mut);
    let timestamp = clock::timestamp_ms(clock);
    
    event::emit(CredentialIssued {
        credential_id: credential_id_inner,
        identity_id: identity_id_inner,
        credential_type,
        issuer: issuer_cap.issuer_address,
        issuer_name: issuer_cap.name,
        timestamp,
    });
}

/// @notice Revoke a credential
public entry fun revoke_credential(
    issuer_cap: &IssuerCap,
    identity: &mut Identity,
    credential_type: String,
    clock: &Clock,
) {

    let key = CredentialKey {
        credential_type,
        issuer: issuer_cap.issuer_address,
    };
    
    let identity_id = identity_registry::id_mut(identity);
    
    assert!(df::exists_(identity_id, key), ECredentialNotFound);
    
    let credential: &mut Credential = df::borrow_mut(identity_id, key);
    
    // Verify the issuer is the one who issued the credential
    assert!(credential.issuer == issuer_cap.issuer_address, ENotAuthorized);
    
    // Mark as revoked
    credential.revoked = true;
    
    // Emit event
    let credential_id = object::uid_to_inner(&credential.id);
    let timestamp = clock::timestamp_ms(clock);
    
    event::emit(CredentialRevoked {
        credential_id,
        identity_id: object::uid_to_inner(identity_id),
        timestamp,
    });
}

/// @notice Delete a credential (can be done by the identity owner)
public entry fun delete_credential(
    identity: &mut Identity,
    credential_type: String,
    issuer: address,
    ctx: &mut TxContext
) {
    // Verify caller is the identity owner
    assert!(identity_registry::owner(identity) == tx_context::sender(ctx), ENotAuthorized);

    let identity_id = identity_registry::id(identity);
    let key = CredentialKey {
        credential_type,
        issuer,
    };
    
    assert!(df::exists_(identity_id, key), ECredentialNotFound);
    
    let credential: Credential = df::remove(identity_registry::id_mut(identity), key);
    let Credential { id, credential_type: _, issuer: _, issuer_name: _, 
                  issued_at: _, expiration: _, data: _, metadata: _, revoked: _ } = credential;
    object::delete(id);
}

// ======== Query functions ========

/// @notice Check if an identity has a valid credential of a specific type
public fun has_valid_credential(
    identity: &Identity,
    credential_type: String,
    issuer: address,
    ctx: &TxContext
): bool {
    let identity_id = identity_registry::id(identity);
    let key = CredentialKey {
        credential_type,
        issuer,
    };
    
    if (!df::exists_(identity_id, key)) {
        return false
    };
    
    let credential: &Credential = df::borrow(identity_id, key);
    
    // Check if revoked
    if (credential.revoked) {
        return false
    };
    
    // Check if expired
    if (option::is_some(&credential.expiration)) {
        let expiration = *option::borrow(&credential.expiration);
        if (tx_context::epoch(ctx) > expiration) {
            return false
        };
    };
    
    true
}

/// @notice Get credential info
public fun get_credential_info(
    identity: &Identity,
    credential_type: String,
    issuer: address
): Option<CredentialInfo> {
    let identity_id = identity_registry::id(identity);
    let key = CredentialKey {
        credential_type,
        issuer,
    };
    
    if (!df::exists_(identity_id, key)) {
        return option::none<CredentialInfo>()
    };
    
    let credential: &Credential = df::borrow(identity_id, key);
    
    let info = CredentialInfo {
        id: object::uid_to_inner(&credential.id),
        credential_type: credential.credential_type,
        issuer: credential.issuer,
        issuer_name: credential.issuer_name,
        issued_at: credential.issued_at,
        expiration: credential.expiration,
        metadata: credential.metadata,
        revoked: credential.revoked,
    };
    
    option::some(info)
}

/// @notice Get all credential types for an identity
public fun get_all_credential_types(identity: &Identity): vector<String> {
    let identity_id = identity_registry::id(identity);
    let registry_key = CredentialRegistryKey {};
    
    if (!df::exists_(identity_id, registry_key)) {
        return vector::empty<String>()
    };
    
    let registry: &CredentialRegistry = df::borrow(identity_id, registry_key);
    let mut result = vector::empty<String>();
    
    let mut i = 0;
    let len = vector::length(&registry.keys);
    
    while (i < len) {
        let key = vector::borrow(&registry.keys, i);
        vector::push_back(&mut result, key.credential_type);
        i = i + 1;
    };
    
    result
}

/// @notice Get all credential infos for an identity
public fun get_all_credentials(
    identity: &Identity,
): vector<CredentialInfo> {
    let identity_id = identity_registry::id(identity);
    let registry_key = CredentialRegistryKey {};
    
    if (!df::exists_(identity_id, registry_key)) {
        return vector::empty<CredentialInfo>()
    };
    
    let registry: &CredentialRegistry = df::borrow(identity_id, registry_key);
    let mut result = vector::empty<CredentialInfo>();
    
    let mut i = 0;
    let len = vector::length(&registry.keys);
    
    while (i < len) {
        let key = vector::borrow(&registry.keys, i);
        let mut credential_info_opt = get_credential_info(
            identity, 
            key.credential_type, 
            key.issuer
        );
        
        if (option::is_some(&credential_info_opt)) {
            let credential_info = option::extract(&mut credential_info_opt);
            vector::push_back(&mut result, credential_info);
        };
        i = i + 1;
    };
    
    result
}

/// @notice Get all valid credential infos for an identity
public fun get_valid_credentials(
    identity: &Identity,
    ctx: &TxContext
): vector<CredentialInfo> {
    let identity_id = identity_registry::id(identity);
    let registry_key = CredentialRegistryKey {};
    
    if (!df::exists_(identity_id, registry_key)) {
        return vector::empty<CredentialInfo>()
    };
    
    let registry: &CredentialRegistry = df::borrow(identity_id, registry_key);
    let mut result = vector::empty<CredentialInfo>();
    
    let mut i = 0;
    let len = vector::length(&registry.keys);
    
    while (i < len) {
        let key = vector::borrow(&registry.keys, i);
        
        if (has_valid_credential(identity, key.credential_type, key.issuer, ctx)) {
            let mut credential_info_opt = get_credential_info(
                identity, 
                key.credential_type, 
                key.issuer
            );
            
            if (option::is_some(&credential_info_opt)) {
                let credential_info = option::extract(&mut credential_info_opt);
                vector::push_back(&mut result, credential_info);
            };
        };
        
        i = i + 1;
    };
    
    result
}

/// @notice Check if identity has a credential from a specific issuer and type
/// This is the recommended way to check for credentials since we can't iterate
public fun has_credential(
    identity: &Identity,
    credential_type: String,
    issuer: address
): bool {
    let key = CredentialKey {
        credential_type,
        issuer,
    };
    
    let identity_id = identity_registry::id(identity);
    df::exists_(identity_id, key)
}

/// @notice Get credential data (only available to the identity owner or the issuer)
public fun get_credential_data(
    identity: &Identity,
    credential_type: String,
    issuer: address,
    ctx: &TxContext
): Option<vector<u8>> {
    let sender = tx_context::sender(ctx);
    let id = identity_registry::id(identity);
    
    // Only the identity owner or the issuer can access the data
    if (identity_registry::owner(identity) != sender && issuer != sender) {
        return option::none<vector<u8>>()
    };
    
    let key = CredentialKey {
        credential_type,
        issuer,
    };
    
    if (!df::exists_(id, key)) {
        return option::none<vector<u8>>()
    };
    
    let credential: &Credential = df::borrow(id, key);
    option::some(credential.data)
}