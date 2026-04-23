using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace Filamorfosis.API.Authorization;

/// <summary>
/// Authorization attribute that requires the caller to have:
///   1. At least one of the four admin roles:
///      Master, UserManagement, ProductManagement, or OrderManagement
///   2. A <c>mfa_verified = "true"</c> claim in their JWT
///
/// Apply this to all admin controllers. Per-controller role scoping is
/// enforced by a separate <c>[Authorize(Roles = "...")]</c> attribute.
///
/// Requirements: 2.1, 7.1
/// </summary>
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = false)]
public class RequireMfaAttribute : Attribute, IAuthorizationFilter
{
    private static readonly string[] AdminRoles =
        ["Master", "UserManagement", "ProductManagement", "OrderManagement"];

    public void OnAuthorization(AuthorizationFilterContext context)
    {
        var user = context.HttpContext.User;

        // Not authenticated at all → 401
        if (user.Identity is null || !user.Identity.IsAuthenticated)
        {
            context.Result = new UnauthorizedObjectResult(new
            {
                type = "https://filamorfosis.com/errors/unauthorized",
                title = "Unauthorized",
                status = 401,
                detail = "Authentication is required."
            });
            return;
        }

        // Authenticated but holds none of the four admin roles → 403
        if (!AdminRoles.Any(r => user.IsInRole(r)))
        {
            context.Result = new ObjectResult(new
            {
                type = "https://filamorfosis.com/errors/forbidden",
                title = "Forbidden",
                status = 403,
                detail = "You do not have permission to access this resource."
            })
            { StatusCode = 403 };
            return;
        }

        // Admin role present but MFA not verified → 403
        var mfaVerified = user.FindFirstValue("mfa_verified");
        if (mfaVerified != "true")
        {
            context.Result = new ObjectResult(new
            {
                type = "https://filamorfosis.com/errors/mfa-required",
                title = "Forbidden",
                status = 403,
                detail = "MFA verification is required to access admin resources."
            })
            { StatusCode = 403 };
        }
    }
}
