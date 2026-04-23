using System.Security.Claims;
using Filamorfosis.API.Authorization;
using Filamorfosis.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Filamorfosis.API.Controllers;

/// <summary>
/// Admin users management controller.
/// Controller-level: Master + UserManagement can read.
/// Action-level: only Master can create or update roles.
///
/// Requirements: 1.4, 2.5, 4.1–4.6, 5.1–5.6, 9.1, 9.3–9.5
/// </summary>
[ApiController]
[Route("api/v1/admin/users")]
[Authorize(Roles = "Master,UserManagement")]
[RequireMfa]
public class AdminUsersController(UserManager<User> userManager) : ControllerBase
{
    private const string MasterAccountEmail = "admin@filamorfosis.com";

    private static readonly HashSet<string> ValidAdminRoles =
        ["Master", "UserManagement", "ProductManagement", "OrderManagement", "PriceManagement"];

    private static readonly HashSet<string> ValidAssignableRoles =
        ["Master", "UserManagement", "ProductManagement", "OrderManagement", "PriceManagement", "Customer"];

    // GET /api/v1/admin/users
    // Returns all users except the master account (admin@filamorfosis.com).
    // Requirements: 9.1
    [HttpGet]
    public async Task<IActionResult> GetAllUsers()
    {
        var users = await userManager.Users
            .Where(u => u.Email != MasterAccountEmail)
            .Include(u => u.MfaSecret)
            .OrderByDescending(u => u.CreatedAt)
            .ToListAsync();

        var result = new List<object>();
        foreach (var user in users)
        {
            var roles = await userManager.GetRolesAsync(user);
            result.Add(new
            {
                user.Id,
                user.Email,
                user.FirstName,
                user.LastName,
                Roles = roles.ToList(),
                user.CreatedAt,
                MfaEnabled = user.MfaSecret?.IsConfirmed == true
            });
        }

        return Ok(result);
    }

    // POST /api/v1/admin/users — Master only
    // Requirements: 4.1, 4.2, 4.3, 4.4, 4.6, 1.6
    [HttpPost]
    [Authorize(Roles = "Master")]
    public async Task<IActionResult> CreateAdminUser([FromBody] CreateAdminUserRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) ||
            string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new { detail = "Email y contraseña son requeridos" });
        }

        List<string> rolesToAssign;

        if (request.Roles is { Count: > 0 })
        {
            // Multi-role path: validate each role against ValidAdminRoles
            var invalidRoles = request.Roles.Where(r => !ValidAdminRoles.Contains(r)).ToList();
            if (invalidRoles.Count > 0)
            {
                return BadRequest(new
                {
                    detail = $"Rol inválido. Los valores permitidos son: {string.Join(", ", ValidAdminRoles)}."
                });
            }
            rolesToAssign = request.Roles;
        }
        else
        {
            // Single-role fallback: default to OrderManagement
            var role = string.IsNullOrWhiteSpace(request.Role) ? "OrderManagement" : request.Role;
            if (!ValidAdminRoles.Contains(role))
            {
                return BadRequest(new
                {
                    detail = $"Rol inválido. Los valores permitidos son: {string.Join(", ", ValidAdminRoles)}."
                });
            }
            rolesToAssign = [role];
        }

        var existingUser = await userManager.FindByEmailAsync(request.Email);
        if (existingUser != null)
            return BadRequest(new { detail = "El usuario ya existe" });

        var user = new User
        {
            UserName = request.Email,
            Email = request.Email,
            FirstName = request.FirstName ?? string.Empty,
            LastName = request.LastName ?? string.Empty,
            EmailConfirmed = true,
            CreatedAt = DateTime.UtcNow
        };

        var result = await userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
            return BadRequest(new { detail = string.Join(", ", result.Errors.Select(e => e.Description)) });

        foreach (var r in rolesToAssign)
        {
            var roleResult = await userManager.AddToRoleAsync(user, r);
            if (!roleResult.Succeeded)
            {
                await userManager.DeleteAsync(user);
                return BadRequest(new { detail = "Error al asignar rol de administrador" });
            }
        }

        // Return single role for backward compat when only one role assigned
        return Ok(new
        {
            id = user.Id,
            email = user.Email,
            role = rolesToAssign.Count == 1 ? rolesToAssign[0] : (object)rolesToAssign
        });
    }

    // DELETE /api/v1/admin/users/{userId} — Master only
    [HttpDelete("{userId}")]
    [Authorize(Roles = "Master")]
    public async Task<IActionResult> DeleteAdminUser(string userId)
    {
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == currentUserId)
            return StatusCode(403, new { detail = "No puedes eliminar tu propia cuenta." });

        var user = await userManager.FindByIdAsync(userId);
        if (user == null) return NotFound(new { detail = "Usuario no encontrado" });

        if (user.Email == MasterAccountEmail)
            return StatusCode(403, new { detail = "La cuenta maestra no puede ser eliminada." });

        var result = await userManager.DeleteAsync(user);
        if (!result.Succeeded)
            return BadRequest(new { detail = string.Join(", ", result.Errors.Select(e => e.Description)) });

        return NoContent();
    }

    // PUT /api/v1/admin/users/{userId}/roles — Master only
    // Replaces ALL current roles with the supplied list.
    // Requirements: 1.2, 1.3, 1.4, 1.8
    [HttpPut("{userId}/roles")]
    [Authorize(Roles = "Master")]
    public async Task<IActionResult> UpdateUserRoles(string userId, [FromBody] UpdateUserRolesRequest request)
    {
        // Self-action prevention (Req 1.8)
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == currentUserId)
        {
            return StatusCode(403, new
            {
                type = "https://filamorfosis.com/errors/forbidden",
                title = "Forbidden",
                status = 403,
                detail = "No puedes modificar tu propia cuenta."
            });
        }

        // Validate roles list is non-empty (Req 1.3)
        if (request.Roles is not { Count: > 0 })
        {
            return BadRequest(new { detail = "Se requiere al menos un rol." });
        }

        // Validate each role (Req 1.4)
        var invalidRoles = request.Roles.Where(r => !ValidAssignableRoles.Contains(r)).ToList();
        if (invalidRoles.Count > 0)
        {
            return BadRequest(new
            {
                detail = $"Rol inválido. Los valores permitidos son: {string.Join(", ", ValidAssignableRoles)}."
            });
        }

        var user = await userManager.FindByIdAsync(userId);
        if (user == null)
            return NotFound(new { detail = "Usuario no encontrado" });

        // Master account protection
        if (user.Email == MasterAccountEmail)
        {
            return StatusCode(403, new
            {
                type = "https://filamorfosis.com/errors/forbidden",
                title = "Forbidden",
                status = 403,
                detail = "La cuenta maestra no puede ser modificada."
            });
        }

        // Remove all current roles, then assign the new list
        var currentRoles = await userManager.GetRolesAsync(user);
        if (currentRoles.Any())
        {
            var removeResult = await userManager.RemoveFromRolesAsync(user, currentRoles);
            if (!removeResult.Succeeded)
                return BadRequest(new { detail = "Error al remover roles actuales" });
        }

        foreach (var role in request.Roles)
        {
            var addResult = await userManager.AddToRoleAsync(user, role);
            if (!addResult.Succeeded)
                return BadRequest(new { detail = $"Error al asignar rol: {role}" });
        }

        return Ok(new
        {
            userId = user.Id,
            roles = request.Roles
        });
    }

    // PUT /api/v1/admin/users/{userId}/role — Master only
    // Requirements: 5.1, 5.2, 5.4, 5.5, 5.6, 9.3, 9.4, 9.5
    [HttpPut("{userId}/role")]
    [Authorize(Roles = "Master")]
    public async Task<IActionResult> UpdateUserRole(string userId, [FromBody] UpdateUserRoleRequest request)
    {
        // Self-action prevention (Req 9.4, 9.5)
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == currentUserId)
        {
            return StatusCode(403, new
            {
                type = "https://filamorfosis.com/errors/forbidden",
                title = "Forbidden",
                status = 403,
                detail = "No puedes modificar tu propia cuenta."
            });
        }

        var user = await userManager.FindByIdAsync(userId);
        if (user == null)
            return NotFound(new { detail = "Usuario no encontrado" });

        // Master account protection (Req 9.3)
        if (user.Email == MasterAccountEmail)
        {
            return StatusCode(403, new
            {
                type = "https://filamorfosis.com/errors/forbidden",
                title = "Forbidden",
                status = 403,
                detail = "La cuenta maestra no puede ser modificada."
            });
        }

        // Validate role (Req 5.4)
        if (!ValidAssignableRoles.Contains(request.Role))
        {
            return BadRequest(new
            {
                detail = $"Rol inválido. Los valores permitidos son: {string.Join(", ", ValidAssignableRoles)}."
            });
        }

        // Remove all current roles, then assign new one (Req 5.2)
        var currentRoles = await userManager.GetRolesAsync(user);
        if (currentRoles.Any())
        {
            var removeResult = await userManager.RemoveFromRolesAsync(user, currentRoles);
            if (!removeResult.Succeeded)
                return BadRequest(new { detail = "Error al remover roles actuales" });
        }

        var addResult = await userManager.AddToRoleAsync(user, request.Role);
        if (!addResult.Succeeded)
            return BadRequest(new { detail = "Error al asignar nuevo rol" });

        return Ok(new
        {
            userId = user.Id,
            newRole = request.Role
        });
    }
}

public record CreateAdminUserRequest(
    string Email,
    string Password,
    string? FirstName,
    string? LastName,
    string? Role,          // "Master" | "UserManagement" | "ProductManagement" | "OrderManagement" | "PriceManagement" — defaults to "OrderManagement"
    List<string>? Roles    // Multi-role list; takes precedence over Role when non-empty
);

public record UpdateUserRoleRequest(
    string Role   // "Master" | "UserManagement" | "ProductManagement" | "OrderManagement" | "PriceManagement" | "Customer"
);

public record UpdateUserRolesRequest(List<string> Roles);
