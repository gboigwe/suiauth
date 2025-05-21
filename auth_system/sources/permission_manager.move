// Copyright (c) 2025, SuiAuth Contributors
// SPDX-License-Identifier: MIT

/// @title Permission Manager Module
/// @notice Manages permissions for applications to access user identities
/// @dev Implements a flexible permission system with scopes and expiration
#[allow(unused_const)]
module auth_system::permission_manager;

use sui::event;

use std::string::{Self, String};
use auth_system::identity_registry::{Self, Identity};
use sui::clock::{Self, Clock};
use sui::dynamic_field as df;

// ======== Error codes ========
const ENotAuthorized: u64 = 1;
const EIdentityNotActive: u64 = 2;
const EPermissionNotFound: u64 = 3;
const EPermissionExpired: u64 = 4;
const EScopeNotFound: u64 = 5;
const EPermissionAlreadyExists: u64 = 6;
const EInvalidAppId: u64 = 7;
const EInvalidAppName: u64 = 8;

// ======== Types ========

/// @notice Type to use as a key for storing permissions
public struct PermissionKey has copy, drop, store {
    app_id: String
}

/// @notice Permission object representing access for a specific app
public struct Permission has key, store {
    id: UID,
    /// The application ID this permission is for
    app_id: String,
    /// Human-readable app name
    app_name: String,
    /// Scopes this permission grants access to
    scopes: vector<String>,
    /// Optional expiration time (epoch)
    expiration: Option<u64>,
    /// When this permission was granted
    granted_at: u64,
    /// URL of the app (optional)
    app_url: Option<String>,
    /// Icon URL for the app (optional)
    app_icon_url: Option<String>,
}

/// @notice Public info about a permission
public struct PermissionInfo has copy, drop, store {
    id: ID,
    app_id: String,
    app_name: String,
    scopes: vector<String>,
    expiration: Option<u64>,
    granted_at: u64,
    app_url: Option<String>,
    app_icon_url: Option<String>,
}

/// @notice Get all app IDs that have permissions for this identity using an index
public struct PermissionAppIndex has copy, drop, store {
    app_ids: vector<String>
}

/// @notice Key for storing the permission app index
public struct PermissionAppIndexKey has copy, drop, store {}

// ========== Events ==========

/// @notice Emitted when a permission is granted
public struct PermissionGranted has copy, drop {
    identity_id: ID,
    app_id: String,
    app_name: String,
    scopes: vector<String>,
    expiration: Option<u64>,
    timestamp: u64,
}

/// @notice Emitted when permission is updated
public struct PermissionUpdated has copy, drop {
    identity_id: ID,
    app_id: String,
    scopes: vector<String>,
    expiration: Option<u64>,
    timestamp: u64,
}

/// @notice Emitted when a permission is revoked
public struct PermissionRevoke has copy, drop {
    identity_id: ID,
    app_id: String,
    timestamp: u64,
}

// ========= Helper Functions ==========
/// @notice Validate basic Permission parameters
public fun validate_permission_params(app_id: &String, app_name: &String) {
    // Ensure app id is not empty
    assert!(string::length(app_id) > 0, EInvalidAppId);

    // Ensure app name is not empty
    assert!(string::length(app_name) > 0, EInvalidAppName);
}

/// @notice Check if a permission is expired
public fun is_permission_expired(permission: &Permission, ctx: &TxContext): bool {
    if (option::is_some(&permission.expiration)) {
        let expiration = *option::borrow(&permission.expiration);
        return tx_context::epoch(ctx) > expiration
    };

    false
}

/// @notice Check if a scope exists in a permission
public fun scope_exists_in_permission(permission: &Permission, scope: &String): bool {
    let mut i = 0;
    let len = vector::length(&permission.scopes);
    
    while (i < len) {
        if (*vector::borrow(&permission.scopes, i) == *scope) {
            return true
        };
        i = i + 1;
    };
    
    false
}

// ========== Permission Functions ==========

// Entry function that can be called directly in a transaction
/// @notice Grants permission to an application
public entry fun grant_permission(
    identity: &mut Identity,
    app_id: String,
    app_name: String,
    scopes: vector<String>,
    expiration: Option<u64>,
    app_url: Option<String>,
    app_icon_url: Option<String>,
    clock: &Clock,
    ctx: &mut TxContext
) {
    // Verify that caller is the identuty owner
    assert!(identity_registry::owner(identity) == tx_context::sender(ctx), ENotAuthorized);
    assert!(identity_registry::is_active(identity), EIdentityNotActive);

    let permission_key = PermissionKey { app_id: app_id };
    let id = identity_registry::id(identity);
    let identity_id = object::uid_to_inner(id);
        
    // Check if permission already exists
    if (df::exists_(id, permission_key)) {
        // Update existing permission
        let permission: &mut Permission = df::borrow_mut(identity_registry::id_mut(identity), permission_key);
        permission.scopes = scopes;
        permission.expiration = expiration;
        permission.app_name = app_name;
        permission.app_url = app_url;
        permission.app_icon_url = app_icon_url;

        let timestamp = clock::timestamp_ms(clock);
        // Emit Event
        event::emit(PermissionUpdated {
            identity_id,
            app_id,
            scopes,
            expiration,
            timestamp,
        });
    } else {
        // Create new permission
        let permission = Permission {
            id: object::new(ctx),
            app_id,
            app_name,
            scopes,
            expiration,
            granted_at: tx_context::epoch(ctx),
            app_url,
            app_icon_url
        };

        // Add permission as a dynamic field
        df::add( identity_registry::id_mut(identity), permission_key, permission);
        
        let timestamp = clock::timestamp_ms(clock);
        event::emit(PermissionGranted {
            identity_id,
            app_id,
            app_name,
            scopes,
            expiration,
            timestamp,
        });
    };
}

/// @notice Revokes permission for an application
public entry fun revoke_permission(
    identity: &mut Identity,
    app_id: String,
    clock: &Clock,
    ctx: &mut TxContext
) {
    // Verify caller is the identity owner
    assert!(identity_registry::owner(identity) == tx_context::sender(ctx), ENotAuthorized);

    let permission_key = PermissionKey { app_id: app_id };
    if (df::exists_(identity_registry::id(identity), permission_key)) {
        // Remove permission
        let id = identity_registry::id(identity);
        let identity_id = object::uid_to_inner(id);
        let permission: Permission = df::remove(identity_registry::id_mut(identity), permission_key);

        // Cleanup the permission object
        let Permission {
            id,
            app_id: _,
            app_name: _,
            scopes: _,
            expiration: _,
            granted_at: _,
            app_url: _,
            app_icon_url: _
        } = permission;

        object::delete(id);
        
        let timestamp = clock::timestamp_ms(clock);
        event::emit(PermissionRevoke {
            identity_id,
            app_id,
            timestamp,
        });
    } else {
        // Permission does not exist, do nothing
        return
    };
}

/// @notice Check if an identity has granted permission for a specific app and scope
public fun has_permission(
    identity: &Identity,
    app_id: String,
    scope: String,
    ctx: &mut TxContext
): bool {
    let permission_key = PermissionKey { app_id: app_id };
    let id = identity_registry::id(identity);

    if (!df::exists_(id, permission_key)) {
        return false
    };

    let permission: &Permission = df::borrow(id, permission_key);

    // Check if the permission already expired
    if (is_permission_expired(permission, ctx)) {
        return false
    };

    // Check if scope is included
    scope_exists_in_permission(permission, &scope)
}

/// @notice Check if an identity has granted permissions for a specific app
public fun has_any_permission(
    identity: &Identity,
    app_id: String,
    ctx: &TxContext
): bool {
    let permission_key = PermissionKey { app_id: app_id };
    let id = identity_registry::id(identity);
    
    if (!df::exists_(id, permission_key)) {
        return false
    };
    
    let permission: &Permission = df::borrow(id, permission_key);
    
    // Check if expired
    if (is_permission_expired(permission, ctx)) {
        return false
    };
    
    // Check if there are any scopes
    vector::length(&permission.scopes) > 0
}

/// @notice Get all scopes for a permission
public fun get_scopes(
    identity: &Identity,
    app_id: String,
    ctx: &TxContext
): vector<String> {
    let permission_key = PermissionKey { app_id: app_id };
    let id = identity_registry::id(identity);
    
    if (!df::exists_(id, permission_key)) {
        return vector::empty<String>()
    };
    
    let permission: &Permission = df::borrow(id, permission_key);
    
    // Check if expired
    if (is_permission_expired(permission, ctx)) {
        return vector::empty<String>()
    };
    
    permission.scopes
}

/// @notice Get permission info
public fun get_permission_info(
    identity: &Identity,
    app_id: String
): Option<PermissionInfo> {
    let permission_key = PermissionKey { app_id: app_id };
    let id = identity_registry::id(identity);
    
    if (!df::exists_(id, permission_key)) {
        return option::none<PermissionInfo>()
    };
    
    let permission: &Permission = df::borrow(id, permission_key);
    
    let info = PermissionInfo {
        id: object::uid_to_inner(&permission.id),
        app_id: permission.app_id,
        app_name: permission.app_name,
        scopes: permission.scopes,
        expiration: permission.expiration,
        granted_at: permission.granted_at,
        app_url: permission.app_url,
        app_icon_url: permission.app_icon_url,
    };
    
    option::some(info)
}

/// @notice Add a scope to an existing permission
public entry fun add_scope(
    identity: &mut Identity,
    app_id: String,
    scope: String,
    clock: &Clock,
    ctx: &mut TxContext
) {
    // Verify caller is the identity owner
    assert!(identity_registry::owner(identity) == tx_context::sender(ctx), ENotAuthorized);
    assert!(identity_registry::is_active(identity), EIdentityNotActive);
    
    let permission_key = PermissionKey { app_id: app_id };

    // First check if the permission exists and get identity ID
    let id = identity_registry::id(identity);
    let identity_id = object::uid_to_inner(id);
    assert!(df::exists_(id, permission_key), EPermissionNotFound);
    
    // Now get mutable ID - we need to use a single mutable borrow
    // and pass it around as needed, rather than deriving it multiple times
    let permission: &mut Permission = {
        let id_mut = identity_registry::id_mut(identity);
        df::borrow_mut(id_mut, permission_key)
    };
    
    // Check if scope already exists
    if (!scope_exists_in_permission(permission, &scope)) {
        vector::push_back(&mut permission.scopes, scope);
        
        let timestamp = clock::timestamp_ms(clock);
        let scopes_copy = permission.scopes;
        let expiration_copy = permission.expiration;
        
        // Use copied values for the event
        event::emit(PermissionUpdated {
            identity_id,
            app_id,
            scopes: scopes_copy,
            expiration: expiration_copy,
            timestamp,
        });
    };
}

/// @notice Remove a scope from an existing permission
public entry fun remove_scope(
    identity: &mut Identity,
    app_id: String,
    scope: String,
    clock: &Clock,
    ctx: &mut TxContext
) {
    // Verify caller is the identity owner
    assert!(identity_registry::owner(identity) == tx_context::sender(ctx), ENotAuthorized);
    
    let permission_key = PermissionKey { app_id: app_id };

    // Get identity ID first while borrowing immutably
    let id = identity_registry::id(identity);
    let identity_id = object::uid_to_inner(id);
    assert!(df::exists_(id, permission_key), EPermissionNotFound);

    // Now do the mutable operations in a scope
    let (scopes_modified, expiration_copy) = {
        let id_mut = identity_registry::id_mut(identity);
        let permission: &mut Permission = df::borrow_mut(id_mut, permission_key);
        
        // Find the scope index
        let mut i = 0;
        let len = vector::length(&permission.scopes);
        let mut scope_index = option::none();
        
        while (i < len) {
            if (*vector::borrow(&permission.scopes, i) == scope) {
                scope_index = option::some(i);
                break
            };
            i = i + 1;
        };
        
        // Remove the scope if found
        if (option::is_some(&scope_index)) {
            let idx = *option::borrow(&scope_index);
            vector::remove(&mut permission.scopes, idx);
            
            // Return updated scopes and expiration
            (permission.scopes, permission.expiration)
        } else {
            abort EScopeNotFound
        }
    };

    let timestamp = clock::timestamp_ms(clock);
    
    event::emit(PermissionUpdated {
        identity_id,
        app_id,
        scopes: scopes_modified,
        expiration: expiration_copy,
        timestamp,
    });
}

/// @notice Update permission expiration
public entry fun update_expiration(
    identity: &mut Identity,
    app_id: String,
    expiration: Option<u64>,
    clock: &Clock,
    ctx: &mut TxContext
) {
    // Verify caller is the identity owner
    assert!(identity_registry::owner(identity) == tx_context::sender(ctx), ENotAuthorized);
    assert!(identity_registry::is_active(identity), EIdentityNotActive);
    
    let permission_key = PermissionKey { app_id: app_id };

    // Get identity ID first while borrowing immutably
    let id = identity_registry::id(identity);
    let identity_id = object::uid_to_inner(id);
    assert!(df::exists_(id, permission_key), EPermissionNotFound);
    
    // Now do the mutable operations in a scope and get updated scopes
    let scopes_copy = {
        let id_mut = identity_registry::id_mut(identity);
        let permission: &mut Permission = df::borrow_mut(id_mut, permission_key);
        
        // Update the expiration
        permission.expiration = expiration;
        
        // Return a copy of scopes for the event
        permission.scopes
    };
    
    let timestamp = clock::timestamp_ms(clock);
    
    event::emit(PermissionUpdated {
        identity_id,
        app_id,
        scopes: scopes_copy,
        expiration,
        timestamp,
    });
}

/// @notice Initialize permission app index for an identity if it doesn't exist
public fun ensure_permission_app_index(identity: &mut Identity) {
    let index_key = PermissionAppIndexKey {};
    let id = identity_registry::id(identity);

    if (!df::exists_(id, index_key)) {
        df::add(identity_registry::id_mut(identity), index_key, PermissionAppIndex { app_ids: vector::empty<String>() });
    }
}

/// @notice Add app ID to the permission app index
public fun add_to_permission_app_index(identity: &mut Identity, app_id: String) {
    ensure_permission_app_index(identity);
    let index_key = PermissionAppIndexKey {};
    let id_mut = identity_registry::id_mut(identity);

    let index = df::borrow_mut<PermissionAppIndexKey, PermissionAppIndex>(id_mut, index_key);
    
    // Check if app_id already exists in the index
    let mut i = 0;
    let len = vector::length(&index.app_ids);
    let mut exists = false;
    
    while (i < len) {
        if (*vector::borrow(&index.app_ids, i) == app_id) {
            exists = true;
            break
        };
        i = i + 1;
    };
    
    if (!exists) {
        vector::push_back(&mut index.app_ids, app_id);
    }
}

/// @notice Remove app ID from the permission app index
public fun remove_from_permission_app_index(identity: &mut Identity, app_id: String) {
    ensure_permission_app_index(identity);
    let index_key = PermissionAppIndexKey {};
    let id_mut = identity_registry::id_mut(identity);

    let index = df::borrow_mut<PermissionAppIndexKey, PermissionAppIndex>(id_mut, index_key);
    
    // Find and remove app_id from the index
    let mut i = 0;
    let len = vector::length(&index.app_ids);
    let mut idx_opt = option::none();
    
    while (i < len) {
        if (*vector::borrow(&index.app_ids, i) == app_id) {
            idx_opt = option::some(i);
            break
        };
        i = i + 1;
    };
    
    if (option::is_some(&idx_opt)) {
        let idx = *option::borrow(&idx_opt);
        vector::remove(&mut index.app_ids, idx);
    }
}

/// @notice Get all app IDs that have permissions for this identity
public fun get_all_app_ids(identity: &Identity): vector<String> {
    // Note: This is a simplified implementation that would need to be improved
    // in a production environment to handle a large number of permissions
    let index_key = PermissionAppIndexKey {};
    let id = identity_registry::id(identity);

    if (df::exists_(id, index_key)) {
        return vector::empty<String>()
    };
    
    let index = df::borrow<PermissionAppIndexKey, PermissionAppIndex>(id, index_key);

    // Return a copy of the app IDs
    let mut result = vector::empty<String>();
    let mut i = 0;
    let len = vector::length(&index.app_ids);
    
    while (i < len) {
        vector::push_back(&mut result, *vector::borrow(&index.app_ids, i));
        i = i + 1;
    };
    
    result
}


/// @notice Get all permission infos for an identity
public fun get_all_permissions(
    identity: &Identity,
    ctx: &TxContext
): vector<PermissionInfo> {
    let app_ids = get_all_app_ids(identity);
    let mut result = vector::empty<PermissionInfo>();
    
    let mut i = 0;
    let len = vector::length(&app_ids);
    
    while (i < len) {
            let app_id = *vector::borrow(&app_ids, i);
            let permission_key = PermissionKey { app_id: app_id };
            let id = identity_registry::id(identity);
            
            if (df::exists_(id, permission_key)) {
                let permission: &Permission = df::borrow(id, permission_key);
                
                // Only include non-expired permissions
                if (!is_permission_expired(permission, ctx)) {
                    let info = PermissionInfo {
                        id: object::uid_to_inner(&permission.id),
                        app_id: permission.app_id,
                        app_name: permission.app_name,
                        scopes: permission.scopes,
                        expiration: permission.expiration,
                        granted_at: permission.granted_at,
                        app_url: permission.app_url,
                        app_icon_url: permission.app_icon_url,
                    };
                    
                    vector::push_back(&mut result, info);
                };
            };
            
            i = i + 1;
        };
        
        result
}

/// @notice Check if a specific scope is granted in a permission
public fun has_scope(
    identity: &Identity,
    app_id: String,
    scope: String,
    ctx: &mut TxContext
): bool {
    has_permission(identity, app_id, scope, ctx)
}

/// @notice Clear all permissions for an identity
public entry fun clear_all_permissions(
    identity: &mut Identity,
    clock: &Clock,
    ctx: &mut TxContext
) {
    // Verify caller is the identity owner
    assert!(identity_registry::owner(identity) == tx_context::sender(ctx), ENotAuthorized);
    
    // Get all app IDs first
    let app_ids = get_all_app_ids(identity);
    
    // Create a copy to avoid issues with modification during iteration
    let mut app_ids_copy = vector::empty<String>();
    let mut i = 0;
    let mut len = vector::length(&app_ids);
    
    while (i < len) {
        vector::push_back(&mut app_ids_copy, *vector::borrow(&app_ids, i));
        i = i + 1;
    };
    
    // Now iterate through the copy and revoke permissions
    i = 0;
    len = vector::length(&app_ids_copy);
    
    while (i < len) {
        let app_id = *vector::borrow(&app_ids_copy, i);
        revoke_permission(identity, app_id, clock, ctx);
        i = i + 1;
    };
}

/// @notice Get active and expired permissions separately
public fun get_permissions_by_status(
    identity: &Identity,
    ctx: &TxContext
): (vector<PermissionInfo>, vector<PermissionInfo>) {
    let app_ids = get_all_app_ids(identity);
    let mut active = vector::empty<PermissionInfo>();
    let mut expired = vector::empty<PermissionInfo>();
    
    let mut i = 0;
    let len = vector::length(&app_ids);
    
    while (i < len) {
        let app_id = *vector::borrow(&app_ids, i);
        let permission_key = PermissionKey { app_id: app_id };
        let id = identity_registry::id(identity);
        
        if (df::exists_(id, permission_key)) {
            let permission: &Permission = df::borrow(id, permission_key);
            
            let info = PermissionInfo {
                id: object::uid_to_inner(&permission.id),
                app_id: permission.app_id,
                app_name: permission.app_name,
                scopes: permission.scopes,
                expiration: permission.expiration,
                granted_at: permission.granted_at,
                app_url: permission.app_url,
                app_icon_url: permission.app_icon_url,
            };
            
            if (is_permission_expired(permission, ctx)) {
                vector::push_back(&mut expired, info);
            } else {
                vector::push_back(&mut active, info);
            };
        };
        
        i = i + 1;
    };
    
    (active, expired)
}

/// @notice Clear expired permissions for an identity
public entry fun clear_expired_permissions(
    identity: &mut Identity,
    clock: &Clock,
    ctx: &mut TxContext
) {
    // Verify caller is the identity owner
    assert!(identity_registry::owner(identity) == tx_context::sender(ctx), ENotAuthorized);
    
    let app_ids = get_all_app_ids(identity);
    let mut expired_app_ids = vector::empty<String>();
    
    // First identify expired permissions
    let mut i = 0;
    let mut len = vector::length(&app_ids);
    
    while (i < len) {
        let app_id = *vector::borrow(&app_ids, i);
        let permission_key = PermissionKey { app_id: app_id };
        let id = identity_registry::id(identity);
        
        if (df::exists_(id, permission_key)) {
            let permission: &Permission = df::borrow(id, permission_key);
            
            if (is_permission_expired(permission, ctx)) {
                vector::push_back(&mut expired_app_ids, app_id);
            };
        };
        
        i = i + 1;
    };
    
    // Then revoke them
    i = 0;
    len = vector::length(&expired_app_ids);
    
    while (i < len) {
        let app_id = *vector::borrow(&expired_app_ids, i);
        revoke_permission(identity, app_id, clock, ctx);
        i = i + 1;
    };
}