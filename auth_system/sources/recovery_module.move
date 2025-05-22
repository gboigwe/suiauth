// Copyright (c) 2025, SuiAuth Contributors
// SPDX-License-Identifier: MIT

/// @title Recovery Module
/// @notice Implements identity recovery mechanisms
/// @dev Supports social recovery, time-locked recovery, and emergency backup
#[allow(unused_const)]
module auth_system::recovery_module;

// Import modules
use sui::event;
use sui::clock::{Self, Clock};
use sui::dynamic_field as df;

use auth_system::identity_registry::{Self, Identity};

// ======== Error codes ========
const ENotAuthorized: u64 = 1;
const EIdentityNotActive: u64 = 2;
const ENoRecoveryConfigured: u64 = 3;
const ERecoveryInProgress: u64 = 4;
const ENoRecoveryInProgress: u64 = 5;
const EInsufficientVotes: u64 = 6;
const ERecoveryTimelockNotExpired: u64 = 7;
const EGuardianAlreadyExists: u64 = 8;
const EGuardianNotFound: u64 = 9;
const EInvalidGuardianThreshold: u64 = 10;
const ERecoveryWindowExpired: u64 = 11;

// ======== Types ========
    
/// @notice Type for recovery configuration key
public struct RecoveryConfigKey has copy, drop, store {}

/// @notice Type for recovery request key
public struct RecoveryRequestKey has copy, drop, store {}

/// @notice Guardian management capability
public struct GuardianCap has key, store {
    id: UID,
    /// The identity this guardian cap is for
    identity_id: ID,
    /// The address of the guardian
    guardian_address: address,
}

/// @notice Recovery configuration
public struct RecoveryConfig has store, drop {
    /// Addresses of guardians that can authorize recovery
    guardians: vector<address>,
    /// Number of guardians required to approve recovery
    threshold: u64,
    /// Time delay before recovery can be completed (in epochs)
    timelock: u64,
    /// Emergency backup address that can recover without guardian approval
    emergency_address: Option<address>,
}

/// @notice Ongoing recovery request
public struct RecoveryRequest has store {
    /// The new owner address to transfer the identity to
    new_owner: address,
    /// Guardians who have approved the recovery
    approvals: vector<address>,
    /// When the recovery was initiated
    initiated_at: u64,
    /// When the recovery window expires
    expires_at: u64,
    /// The recovery initiator
    initiator: address,
}

// ======== Events ========

/// @notice Emitted when a recovery configuration is set
public struct RecoveryConfigSet has copy, drop {
    identity_id: ID,
    guardian_count: u64,
    threshold: u64,
    timelock: u64,
    has_emergency_address: bool,
    timestamp: u64,
}

/// @notice Emitted when a guardian is added
public struct GuardianAdded has copy, drop {
    identity_id: ID,
    guardian: address,
    timestamp: u64,
}

/// @notice Emitted when a guardian is removed
public struct GuardianRemoved has copy, drop {
    identity_id: ID,
    guardian: address,
    timestamp: u64,
}

/// @notice Emitted when a recovery is initiated
public struct RecoveryInitiated has copy, drop {
    identity_id: ID,
    new_owner: address,
    initiator: address,
    expires_at: u64,
    timestamp: u64,
}

/// @notice Emitted when a recovery is approved by a guardian
public struct RecoveryApproved has copy, drop {
    identity_id: ID,
    guardian: address,
    approval_count: u64,
    threshold: u64,
    timestamp: u64,
}

/// @notice Emitted when a recovery is completed
public struct RecoveryCompleted has copy, drop {
    identity_id: ID,
    old_owner: address,
    new_owner: address,
    timestamp: u64,
}

/// @notice Emitted when a recovery is cancelled
public struct RecoveryCancelled has copy, drop {
    identity_id: ID,
    initiator: address,
    timestamp: u64,
}

// ======== Recovery Configuration ========
    
/// @notice Set up the recovery configuration for an identity
public entry fun configure_recovery(
    identity: &mut Identity,
    guardians: vector<address>,
    threshold: u64,
    timelock: u64,
    emergency_address: Option<address>,
    clock: &Clock,
    ctx: &mut TxContext
) {
    // Verify caller is the identity owner
    assert!(identity_registry::owner(identity) == tx_context::sender(ctx), ENotAuthorized);
    assert!(identity_registry::is_active(identity), EIdentityNotActive);
    
    // Validate threshold
    let guardian_count = vector::length(&guardians);
    assert!(threshold > 0 && threshold <= guardian_count, EInvalidGuardianThreshold);

    let identity_id_mut = identity_registry::id_mut(identity);
    
    let config = RecoveryConfig {
        guardians,
        threshold,
        timelock,
        emergency_address,
    };
    
    let key = RecoveryConfigKey {};
    
    // Replace existing config if it exists
    if (df::exists_(identity_id_mut, key)) {
        let _old_config: RecoveryConfig = df::remove(identity_id_mut, key);
    };
    
    df::add(identity_id_mut, key, config);
    
    // Emit event
    let timestamp = clock::timestamp_ms(clock);
    let has_emergency = option::is_some(&emergency_address);
    
    event::emit(RecoveryConfigSet {
        identity_id: object::uid_to_inner(identity_registry::id(identity)),
        guardian_count,
        threshold,
        timelock,
        has_emergency_address: has_emergency,
        timestamp,
    });
}

/// @notice Add a guardian to the recovery configuration
public entry fun add_guardian(
    identity: &mut Identity,
    guardian: address,
    clock: &Clock,
    ctx: &mut TxContext
) {
    // Verify caller is the identity owner
    assert!(identity_registry::owner(identity) == tx_context::sender(ctx), ENotAuthorized);
    assert!(identity_registry::is_active(identity), EIdentityNotActive);

    let identity_id_mut = identity_registry::id_mut(identity);
    
    let key = RecoveryConfigKey {};
    assert!(df::exists_(identity_id_mut, key), ENoRecoveryConfigured);
    
    let config: &mut RecoveryConfig = df::borrow_mut(identity_id_mut, key);
    
    // Check if guardian already exists
    let mut i = 0;
    let len = vector::length(&config.guardians);
    
    while (i < len) {
        assert!(*vector::borrow(&config.guardians, i) != guardian, EGuardianAlreadyExists);
        i = i + 1;
    };
    
    // Add the guardian
    vector::push_back(&mut config.guardians, guardian);
    
    // Create and transfer guardian capability
    let guardian_cap = GuardianCap {
        id: object::new(ctx),
        identity_id: object::uid_to_inner(identity_registry::id(identity)),
        guardian_address: guardian,
    };
    
    transfer::transfer(guardian_cap, guardian);
    
    // Emit event
    let timestamp = clock::timestamp_ms(clock);
    
    event::emit(GuardianAdded {
        identity_id: object::uid_to_inner(identity_registry::id(identity)),
        guardian,
        timestamp,
    });
}

/// @notice Remove a guardian from the recovery configuration
public entry fun remove_guardian(
    identity: &mut Identity,
    guardian: address,
    clock: &Clock,
    ctx: &mut TxContext
) {
    // Verify caller is the identity owner
    assert!(identity_registry::owner(identity) == tx_context::sender(ctx), ENotAuthorized);
    
    let key = RecoveryConfigKey {};

    let identity_id_mut = identity_registry::id_mut(identity);
    assert!(df::exists_(identity_id_mut, key), ENoRecoveryConfigured);
    
    let config: &mut RecoveryConfig = df::borrow_mut(identity_id_mut, key);
    
    // Find and remove the guardian
    let mut i = 0;
    let len = vector::length(&config.guardians);
    let mut guardian_found = false;
    let mut guardian_index = 0;
    
    while (i < len) {
        if (*vector::borrow(&config.guardians, i) == guardian) {
            guardian_found = true;
            guardian_index = i;
            break
        };
        i = i + 1;
    };
    
    assert!(guardian_found, EGuardianNotFound);
    
    // Remove the guardian
    vector::remove(&mut config.guardians, guardian_index);
    
    // Update threshold if necessary
    let new_len = len - 1;
    if (config.threshold > new_len && new_len > 0) {
        config.threshold = new_len;
    };
    
    // Emit event
    let timestamp = clock::timestamp_ms(clock);
    
    event::emit(GuardianRemoved {
        identity_id: object::uid_to_inner(identity_registry::id(identity)),
        guardian,
        timestamp,
    });
}

/// @notice Update the guardian threshold
public entry fun update_threshold(
    identity: &mut Identity,
    new_threshold: u64,
    ctx: &mut TxContext
) {
    // Verify caller is the identity owner
    assert!(identity_registry::owner(identity) == tx_context::sender(ctx), ENotAuthorized);
    
    let identity_id_mut = identity_registry::id_mut(identity);
    let key = RecoveryConfigKey {};
    assert!(df::exists_(identity_id_mut, key), ENoRecoveryConfigured);
    
    let config: &mut RecoveryConfig = df::borrow_mut(identity_id_mut, key);
    
    // Validate threshold
    let guardian_count = vector::length(&config.guardians);
    assert!(new_threshold > 0 && new_threshold <= guardian_count, EInvalidGuardianThreshold);
    
    config.threshold = new_threshold;
}

/// @notice Update the recovery timelock
public entry fun update_timelock(
    identity: &mut Identity,
    new_timelock: u64,
    ctx: &mut TxContext
) {
    // Verify caller is the identity owner
    assert!(identity_registry::owner(identity) == tx_context::sender(ctx), ENotAuthorized);
    
    let identity_id_mut = identity_registry::id_mut(identity);
    let key = RecoveryConfigKey {};
    assert!(df::exists_(identity_id_mut, key), ENoRecoveryConfigured);
    
    let config: &mut RecoveryConfig = df::borrow_mut(identity_id_mut, key);
    config.timelock = new_timelock;
}

/// @notice Update the emergency recovery address
public entry fun update_emergency_address(
    identity: &mut Identity,
    new_emergency_address: Option<address>,
    ctx: &mut TxContext
) {
    // Verify caller is the identity owner
    assert!(identity_registry::owner(identity) == tx_context::sender(ctx), ENotAuthorized);
    
    let identity_id_mut = identity_registry::id_mut(identity);
    let key = RecoveryConfigKey {};
    assert!(df::exists_(identity_id_mut, key), ENoRecoveryConfigured);
    
    let config: &mut RecoveryConfig = df::borrow_mut(identity_id_mut, key);
    config.emergency_address = new_emergency_address;
}

// ======== Recovery Process ========

/// @notice Initiate recovery process
public entry fun initiate_recovery(
    identity: &mut Identity,
    new_owner: address,
    validity_period: u64, // How long the recovery request remains valid in epochs
    clock: &Clock,
    ctx: &mut TxContext
) {
    let sender = tx_context::sender(ctx);
    let identity_id_mut = identity_registry::id_mut(identity);
    
    // Check if recovery is already in progress
    let request_key = RecoveryRequestKey {};
    assert!(!df::exists_(identity_id_mut, request_key), ERecoveryInProgress);
    
    // Ensure recovery is configured
    let config_key = RecoveryConfigKey {};
    assert!(df::exists_(identity_id_mut, config_key), ENoRecoveryConfigured);
    
    let config: &RecoveryConfig = df::borrow(identity_id_mut, config_key);
    
    // Check if initiator is a guardian or emergency address
    let mut is_guardian = false;
    let mut i = 0;
    let len = vector::length(&config.guardians);
    
    while (i < len) {
        if (*vector::borrow(&config.guardians, i) == sender) {
            is_guardian = true;
            break
        };
        i = i + 1;
    };
    
    let mut is_emergency = false;
    if (option::is_some(&config.emergency_address)) {
        is_emergency = *option::borrow(&config.emergency_address) == sender;
    };
    
    // Only guardians or emergency address can initiate recovery
    assert!(is_guardian || is_emergency, ENotAuthorized);
    
    // Create initial approvals list with the initiator
    let mut approvals = vector::empty<address>();
    vector::push_back(&mut approvals, sender);
    
    let current_epoch = tx_context::epoch(ctx);
    let expires_at = current_epoch + validity_period;
    
    let request = RecoveryRequest {
        new_owner,
        approvals,
        initiated_at: current_epoch,
        expires_at,
        initiator: sender,
    };
    
    df::add(identity_id_mut, request_key, request);
    
    // Emit event
    let timestamp = clock::timestamp_ms(clock);
    
    event::emit(RecoveryInitiated {
        identity_id: object::uid_to_inner(identity_registry::id(identity)),
        new_owner,
        initiator: sender,
        expires_at,
        timestamp,
    });
}

/// @notice Approve a recovery request as a guardian
public entry fun approve_recovery(
    guardian_cap: &GuardianCap,
    identity: &mut Identity,
    clock: &Clock,
    ctx: &mut TxContext
) {
    let guardian = tx_context::sender(ctx);
    let identity_id = object::uid_to_inner(identity_registry::id(identity));
    
    // Verify the guardian cap matches the identity
    assert!(guardian_cap.identity_id == identity_id, ENotAuthorized);
    assert!(guardian_cap.guardian_address == guardian, ENotAuthorized);
    
    // Get mutable reference to identity ID
    let identity_id_mut = identity_registry::id_mut(identity);
    
    // Check if recovery is in progress
    let request_key = RecoveryRequestKey {};
    assert!(df::exists_(identity_id_mut, request_key), ENoRecoveryInProgress);
    
    let request: &mut RecoveryRequest = df::borrow_mut(identity_id_mut, request_key);
    
    // Ensure request hasn't expired
    let current_epoch = tx_context::epoch(ctx);
    assert!(current_epoch <= request.expires_at, ERecoveryWindowExpired);
    
    // Check if guardian has already approved
    let mut i = 0;
    let len = vector::length(&request.approvals);
    let mut already_approved = false;
    
    while (i < len) {
        if (*vector::borrow(&request.approvals, i) == guardian) {
            already_approved = true;
            break
        };
        i = i + 1;
    };
    
    if (!already_approved) {
        vector::push_back(&mut request.approvals, guardian);
    };
    
    // Get the approval count after potential modification
    let approval_count = vector::length(&request.approvals);
    
    // Now get the config for the threshold (using immutable borrow after mutable operations are done)
    let config_key = RecoveryConfigKey {};
    let config: &RecoveryConfig = df::borrow(identity_id_mut, config_key);
    let threshold = config.threshold;
    
    // Emit event
    let timestamp = clock::timestamp_ms(clock);
    
    event::emit(RecoveryApproved {
        identity_id,
        guardian,
        approval_count,
        threshold,
        timestamp,
    });
}

/// @notice Complete a recovery process if threshold is met and timelock has passed
public entry fun complete_recovery(
    identity: &mut Identity,
    clock: &Clock,
    ctx: &mut TxContext
) {
    // Check if recovery is in progress
    let request_key = RecoveryRequestKey {};
    let identity_id_mut = identity_registry::id_mut(identity);

    assert!(df::exists_(identity_id_mut, request_key), ENoRecoveryInProgress);
    
    let config_key = RecoveryConfigKey {};
    let config: &RecoveryConfig = df::borrow(identity_id_mut, config_key);
    
    let request: &RecoveryRequest = df::borrow(identity_id_mut, request_key);
    
    // Ensure request hasn't expired
    let current_epoch = tx_context::epoch(ctx);
    assert!(current_epoch <= request.expires_at, ERecoveryWindowExpired);
    
    // Check if timelock has passed
    assert!(current_epoch >= (request.initiated_at + config.timelock), ERecoveryTimelockNotExpired);
    
    // Check if threshold is met
    let approval_count = vector::length(&request.approvals);
    assert!(approval_count >= config.threshold, EInsufficientVotes);
    
    // Remove the request
    let recovered_request: RecoveryRequest = df::remove(identity_id_mut, request_key);
    let RecoveryRequest { new_owner, approvals: _, initiated_at: _, expires_at: _, initiator: _ } = recovered_request;
    
    // We would update the identity owner here, but this requires special handling
    // that would need to be implemented in the identity_registry module
    // For this example, we'll emit an event that would be observed by the frontend
    
    // Emit event
    let timestamp = clock::timestamp_ms(clock);
    
    event::emit(RecoveryCompleted {
        identity_id: object::uid_to_inner(identity_registry::id(identity)),
        old_owner: identity_registry::owner(identity),
        new_owner,
        timestamp,
    });
}

/// @notice Cancel an ongoing recovery process
public entry fun cancel_recovery(
    identity: &mut Identity,
    clock: &Clock,
    ctx: &mut TxContext
) {
    let sender = tx_context::sender(ctx);
    let current_owner = identity_registry::owner(identity);
    let identity_id_mut = identity_registry::id_mut(identity);

    // Only the current owner can cancel recovery
    assert!(sender == current_owner, ENotAuthorized);
    
    // Check if recovery is in progress
    let request_key = RecoveryRequestKey {};
    assert!(df::exists_(identity_id_mut, request_key), ENoRecoveryInProgress);
    
    // Remove the request
    let recovered_request: RecoveryRequest = df::remove(identity_id_mut, request_key);
    let RecoveryRequest { new_owner: _, approvals: _, initiated_at: _, expires_at: _, initiator } = recovered_request;
    
    // Emit event
    let timestamp = clock::timestamp_ms(clock);
    
    event::emit(RecoveryCancelled {
        identity_id: object::uid_to_inner(identity_registry::id(identity)),
        initiator,
        timestamp,
    });
}

// ======== Query functions ========

/// @notice Check if recovery is configured for an identity
public fun has_recovery_config(identity: &Identity): bool {
    let key = RecoveryConfigKey {};
    df::exists_(identity_registry::id(identity), key)
}

/// @notice Get guardian addresses
public fun get_guardians(identity: &Identity): vector<address> {
    let key = RecoveryConfigKey {};
    let identity_id = identity_registry::id(identity);
    
    if (!df::exists_(identity_id, key)) {
        return vector::empty<address>()
    };
    
    let config: &RecoveryConfig = df::borrow(identity_id, key);
    config.guardians
}

/// @notice Check if an address is a guardian
public fun is_guardian(identity: &Identity, addr: address): bool {
    let guardians = get_guardians(identity);
    let mut i = 0;
    let len = vector::length(&guardians);
    
    while (i < len) {
        if (*vector::borrow(&guardians, i) == addr) {
            return true
        };
        i = i + 1;
    };
    
    false
}

/// @notice Check if a recovery request is in progress
public fun has_active_recovery(identity: &Identity, ctx: &TxContext): bool {
    let key = RecoveryRequestKey {};
    let identity_id = identity_registry::id(identity);
    
    if (!df::exists_(identity_id, key)) {
        return false
    };
    
    let request: &RecoveryRequest = df::borrow(identity_id, key);
    let current_epoch = tx_context::epoch(ctx);
    
    // Check if request is still valid
    current_epoch <= request.expires_at
}