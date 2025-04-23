//! This module contains the identity registry for the auth system.
module auth_system::identity_registry;

use sui::event;

// Identity object representing a user
public struct Identity has key {
    id: UID,
    owner: address,
    metadata: vector<u8>, // Additional metadata about the identity
    active: bool,
    created_at: u64,
}

// Events emitted by the identity created
public struct IdentityCreated has copy, drop {
    identity_id: ID,
    owner: address,
}

public struct IdentityUpdated has copy, drop {
    identity_id: ID,
    owner: address,
}

// public struct IdentityDeleted has copy, drop {
//     identity_id: UID,
//     owner: address,
// }

// ==== Key Functions ====

// Create a new identity
public fun create_identity(owner: address, metadata: vector<u8>, ctx: &mut TxContext): Identity {
    let id = object::new(ctx);
    let identity_id = object::uid_to_inner(&id);

    let identity = Identity {
        id: id,
        owner,
        metadata,
        active: true,
        created_at: tx_context::epoch(ctx),
    };

    // Emit event
    event::emit(IdentityCreated {
        identity_id,
        owner,
    });

    identity
}

// Register a new identity and transfer to owner
public entry fun register(metadata: vector<u8>, ctx: &mut TxContext) {
    let owner = tx_context::sender(ctx);
    let identity = create_identity(owner, metadata, ctx);

    // Transfer ownership of the identity
    transfer::transfer(identity, owner);
}

// Check if an identity is active
public fun is_active(identity: &Identity): bool {
    identity.active
}

// Get the owner of an identity
public fun owner(identity: &Identity): address {
    identity.owner
}

// Update identity metadata (only by the owner)
public entry fun update_metadata(identity: &mut Identity, new_metadata: vector<u8>, ctx: &mut TxContext) {
    // Get the sender of the transaction from the context
    let sender = tx_context::sender(ctx);

    // Ensure the sender is the owner of the identity
    assert!(identity.owner == sender, 0);

    // Update the metadata
    identity.metadata = new_metadata;

    // Emit event
    event::emit(IdentityUpdated {
        identity_id: object::uid_to_inner(&identity.id),
        owner: identity.owner,
    });
}

// Deactivate an identity
public entry fun deactivate(identity: &mut Identity, ctx: &mut TxContext) {
    // Get the sender of the transaction from the context
    let sender = tx_context::sender(ctx);

    // Ensure the sender is the owner of the identity
    assert!(identity.owner == sender, 0);
    identity.active = false;

    // Emit event
    event::emit(IdentityCreated {
        identity_id: object::uid_to_inner(&identity.id),
        owner: identity.owner,
    });
}
