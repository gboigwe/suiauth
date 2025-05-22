// Copyright (c) 2025, SuiAuth contributors
// SPDX-License-Identifier: MIT

/// @title Identity Registry Module
/// @notice Core identity management for SuiAuth
/// @dev Manages user identities with zkLogin verification
#[allow(unused_const)]
module auth_system::identity_registry;

use sui::event;
use sui::package;
use sui::display;
use sui::clock::{Self, Clock};

use std::string::{Self, String};

// ======= Error Codes =======
const ENotAuthorized: u64 = 1;
const EIdentityNotActive: u64 = 2;
const EIdentityAlreadyExists: u64 = 3;
const EInvalidProof: u64 = 4;

// ======= Types =======

/// @notice One-time withness for initialization
public struct IDENTITY_REGISTRY has drop {}

/// @notice Display information for identity object
public struct IdentityDisplay has key, store {
    id: UID,    
}

/// @notice Identity object representing a user
public struct Identity has key {
    id: UID,
    /// The owner of this identity (derived from zklogin)
    owner: address,
    /// Human readable name
    name: String,
    /// Avatar/profile picture URI
    avatar_uri: String,
    /// Flag indicating if the identity is active
    active: bool,
    /// The epoch when this identity was created
    created_at: u64,
     /// The epoch when this identity was last updated
    updated_at: u64,
    /// OAuth provider used for authentication (e.g., "google", "facebook")
    provider: String,
    /// Salt used in zkLogin proof generation
    salt: vector<u8>,
    /// Public identifier associated with this identity
    public_identifier: vector<u8>,
}

 /// @notice Identity Info with basic details
public struct IdentityInfo has copy, drop, store {
    id: ID,
    owner: address,
    name: String,
    avatar_uri: String,
    active: bool,
    created_at: u64,
    updated_at: u64,
    provider: String,
}

/// @notice Admin capability for the system
public struct AdminCap has key, store {
    id: UID,
}


// Events emitted by the identity created

/// @notice emitted when a new identity is created 
public struct IdentityCreated has copy, drop {
    identity_id: ID,
    owner: address,
    provider: String,
    timestamp: u64,
}

/// @notice emitted when an identity is updated
public struct IdentityUpdated has copy, drop {
    identity_id: ID,
    owner: address,
    field: String,
    timestamp: u64,
}

/// @notice Emitted when an identity is activated
public struct IdentityActivated has copy, drop {
    identity_id: ID,
    owner: address,
    timestamp: u64,
}

/// @notice Emitted when an identity is deactivated
public struct IdentityDeactivated has copy, drop {
    identity_id: ID,
    owner: address,
    timestamp: u64,
}

// ======= Init function =======

/// @notice module initializer creates the admin capabilities
fun init(withness: IDENTITY_REGISTRY, ctx: &mut TxContext) {
    // Get the sender
    let sender = tx_context::sender(ctx);

    // Create and transfer the admin capability to the publisher
    let admin_cap = AdminCap {
        id: object::new(ctx),
    };
    transfer::transfer(admin_cap, sender);

    // Set up the display for Identity objects 
    let publisher = package::claim(withness, ctx);
    let mut display_obj = display::new_with_fields<Identity>(
        &publisher, 
        vector[
            string::utf8(b"name"),
            string::utf8(b"description"),
            string::utf8(b"image_url"),
            string::utf8(b"creator"),
        ], 
        vector[
            string::utf8(b"{name}"),
            string::utf8(b"SuiAuth Identity for {owner}"),
            string::utf8(b"{avatar_uri}"),
            string::utf8(b"SuiAuth"),
        ], 
        ctx);
        display::update_version(&mut display_obj);
        transfer::public_transfer(publisher, sender);
        transfer::public_transfer(display_obj, sender);
}

// ==== Key Functions ====

/// @notice Create a new identity object
public fun create_identity(
    owner: address,
    name: String,
    avatar_uri: String,
    provider: String,
    salt: vector<u8>,
    public_identifier: vector<u8>,
    clock: &Clock,
    ctx: &mut TxContext
): Identity {
    let id = object::new(ctx);
    let identity_id = object::uid_to_inner(&id);
    let current_epoch = tx_context::epoch(ctx);

    let identity = Identity {
        id: id,
        owner,
        name,
        avatar_uri,
        active: true,
        created_at: current_epoch,
        updated_at: current_epoch,
        provider,
        salt,
        public_identifier,
    };

    // Emit event
    let timestamp = clock::timestamp_ms(clock);
    event::emit(IdentityCreated {
        identity_id,
        owner,
        provider,
        timestamp,
    });

    identity
}

/// @notice Register a new identity with zkLogin
/// @dev Verifies zkLogin proof and creates the identity
/// @param name The display name for the identity
/// @param avatar_uri URI to the avatar image
/// @param provider OAuth provider used (e.g. "google")
/// @param salt zkLogin salt
/// @param public_identifier Public identifier (e.g. sub field from JWT)
/// @param clock Clock object for timestamp
public entry fun register(
    name: String,
    avatar_uri: String,
    provider: String,
    salt: vector<u8>,
    public_identifier: vector<u8>,
    clock: &Clock,
    ctx: &mut TxContext
) {
    // In a real implementation, you would verify the zkLogin proof here
    // For simplicity, we're skipping that step in this example
    
    let owner = tx_context::sender(ctx);
    let identity = create_identity(
        owner, 
        name, 
        avatar_uri, 
        provider, 
        salt, 
        public_identifier,
        clock,
        ctx
    );
    
    transfer::transfer(identity, owner);
}

// ======== Accessory functions =======

/// @notice Get the ID of an identity
public fun id(identity: &Identity): &UID {
    &identity.id
}

/// @notice Get a mutable reference to the identity
public fun id_mut(identity: &mut Identity): &mut UID {
    &mut identity.id
}

// @notice Check if an identity is active
public fun is_active(identity: &Identity): bool {
    identity.active
}

// @notice Get the owner of an identity
public fun owner(identity: &Identity): address {
    identity.owner
}

// @notice Get the name of an identity
public fun name(identity: &Identity): String {
    identity.name
}

// @notice Get the avatar URI of the identity
public fun avatar_uri(identity: &Identity): String {
    identity.avatar_uri
}

// @notice Get the provider of the identity
public fun provider(identity: &Identity): String {
    identity.provider
}

/// @notice Get the created timestamp of an identity
public fun created_at(identity: &Identity): u64 {
    identity.created_at
}

/// @notice Get the updated timestamp of an identity
public fun updated_at(identity: &Identity): u64 {
    identity.updated_at
}

/// @notice Get the salt of an identity
public fun salt(identity: &Identity): vector<u8> {
    identity.salt
}

/// @notice Get public identifier of an identity
public fun public_identifier(identity: &Identity): vector<u8> {
    identity.public_identifier
}

/// @notice Get basic identity info
public fun get_info(identity: &Identity): IdentityInfo {
    IdentityInfo {
        id: object::uid_to_inner(&identity.id),
        owner: identity.owner,
        name: identity.name,
        avatar_uri: identity.avatar_uri,
        active: identity.active,
        created_at: identity.created_at,
        updated_at: identity.updated_at,
        provider: identity.provider,
    }
}

// ======== Update functions ========
// Entry functions:  are type of functions that can be called directly in a transacction

/// @notice Update the name of an identity
public entry fun update_name(
    identity: &mut Identity,
    new_name: String,
    clock: &Clock,
    ctx: &mut TxContext
) {
    // Only the owner can update the identity
    assert!(tx_context::sender(ctx) == identity.owner, ENotAuthorized);
    assert!(identity.active, EIdentityNotActive);
    
    identity.name = new_name;
    identity.updated_at = tx_context::epoch(ctx);
    
    let timestamp = clock::timestamp_ms(clock);
    event::emit(IdentityUpdated {
        identity_id: object::uid_to_inner(&identity.id),
        owner: identity.owner,
        field: string::utf8(b"name"),
        timestamp,
    });
}

/// @notice Update the avatar URI of an identity
public entry fun update_avatar_uri(
    identity: &mut Identity,
    new_avatar_uri: String,
    clock: &Clock,
    ctx: &mut TxContext
) {
    // Only the owner can update the identity
    assert!(tx_context::sender(ctx) == identity.owner, ENotAuthorized);
    assert!(identity.active, EIdentityNotActive);
    
    identity.avatar_uri = new_avatar_uri;
    identity.updated_at = tx_context::epoch(ctx);
    
    let timestamp = clock::timestamp_ms(clock);
    event::emit(IdentityUpdated {
        identity_id: object::uid_to_inner(&identity.id),
        owner: identity.owner,
        field: string::utf8(b"avatar_uri"),
        timestamp,
    });
}

/// @notice Deactivate an identity
public entry fun deactivate(
    identity: &mut Identity,
    clock: &Clock,
    ctx: &mut TxContext
) {
    // Only the owner can deactivate the identity
    assert!(tx_context::sender(ctx) == identity.owner, ENotAuthorized);
    assert!(identity.active, EIdentityNotActive);
    
    identity.active = false;
    identity.updated_at = tx_context::epoch(ctx);
    
    let timestamp = clock::timestamp_ms(clock);
    event::emit(IdentityDeactivated {
        identity_id: object::uid_to_inner(&identity.id),
        owner: identity.owner,
        timestamp,
    });
}

/// @notice Reactivate an identity
public entry fun activate(
    identity: &mut Identity,
    clock: &Clock,
    ctx: &mut TxContext
) {
    // Only the owner can reactivate the identity
    assert!(tx_context::sender(ctx) == identity.owner, ENotAuthorized);
    assert!(!identity.active, 0); // Already active
    
    identity.active = true;
    identity.updated_at = tx_context::epoch(ctx);
    
    let timestamp = clock::timestamp_ms(clock);
    event::emit(IdentityActivated {
        identity_id: object::uid_to_inner(&identity.id),
        owner: identity.owner,
        timestamp,
    });
}

// ======== Admin functions ========

/// @notice Freeze an identity (admin function)
public entry fun admin_freeze(
    _: &AdminCap,
    identity: &mut Identity,
    clock: &Clock,
    ctx: &mut TxContext
) {
    assert!(identity.active, EIdentityNotActive);
    
    identity.active = false;
    identity.updated_at = tx_context::epoch(ctx);
    
    let timestamp = clock::timestamp_ms(clock);
    event::emit(IdentityDeactivated {
        identity_id: object::uid_to_inner(&identity.id),
        owner: identity.owner,
        timestamp,
    });
}

/// @notice Unfreeze an identity (admin function)
public entry fun admin_unfreeze(
    _: &AdminCap,
    identity: &mut Identity,
    clock: &Clock,
    ctx: &mut TxContext
) {
    assert!(!identity.active, 0); // Already active
    
    identity.active = true;
    identity.updated_at = tx_context::epoch(ctx);
    
    let timestamp = clock::timestamp_ms(clock);
    event::emit(IdentityActivated {
        identity_id: object::uid_to_inner(&identity.id),
        owner: identity.owner,
        timestamp,
    });
}
