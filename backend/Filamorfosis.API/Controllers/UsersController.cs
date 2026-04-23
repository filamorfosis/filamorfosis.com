using System.Security.Claims;
using Filamorfosis.Application.DTOs;
using Filamorfosis.Domain.Entities;
using Filamorfosis.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Filamorfosis.API.Controllers;

[ApiController]
[Route("api/v1/users/me")]
[Authorize]
public class UsersController(
    UserManager<User> userManager,
    FilamorfosisDbContext db) : ControllerBase
{
    private Guid CurrentUserId =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub")
            ?? throw new InvalidOperationException("User ID claim missing."));

    [HttpGet]
    public async Task<IActionResult> GetProfile()
    {
        var user = await userManager.Users
            .Include(u => u.Addresses)
            .Include(u => u.MfaSecret)
            .FirstOrDefaultAsync(u => u.Id == CurrentUserId);

        if (user is null) return NotFound();

        var roles = await userManager.GetRolesAsync(user);
        var mfaVerified = User.FindFirstValue("mfa_verified") == "true";

        return Ok(MapProfile(user, roles, mfaVerified));
    }

    [HttpPut]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest req)
    {
        var user = await userManager.FindByIdAsync(CurrentUserId.ToString());
        if (user is null) return NotFound();

        user.FirstName = req.FirstName;
        user.LastName = req.LastName;
        user.PhoneNumber = req.PhoneNumber;

        await userManager.UpdateAsync(user);
        var roles = await userManager.GetRolesAsync(user);
        var mfaVerified = User.FindFirstValue("mfa_verified") == "true";
        return Ok(MapProfile(user, roles, mfaVerified));
    }

    [HttpPost("addresses")]
    public async Task<IActionResult> AddAddress([FromBody] CreateAddressRequest req)
    {
        var address = new Address
        {
            Id = Guid.NewGuid(),
            UserId = CurrentUserId,
            Street = req.Street,
            City = req.City,
            State = req.State,
            PostalCode = req.PostalCode,
            Country = req.Country,
            IsDefault = req.IsDefault
        };

        db.Addresses.Add(address);
        await db.SaveChangesAsync();

        return StatusCode(201, new AddressDto
        {
            Id = address.Id,
            Street = address.Street,
            City = address.City,
            State = address.State,
            PostalCode = address.PostalCode,
            Country = address.Country,
            IsDefault = address.IsDefault
        });
    }

    [HttpDelete("addresses/{addressId:guid}")]
    public async Task<IActionResult> DeleteAddress(Guid addressId)
    {
        var address = await db.Addresses
            .FirstOrDefaultAsync(a => a.Id == addressId && a.UserId == CurrentUserId);

        if (address is null)
            return NotFound(new
            {
                type = "https://filamorfosis.com/errors/not-found",
                title = "Not Found",
                status = 404,
                detail = "Address not found or does not belong to the current user."
            });

        db.Addresses.Remove(address);
        await db.SaveChangesAsync();
        return NoContent();
    }

    private static UserProfileDto MapProfile(User user, IList<string> roles, bool mfaVerified) => new()
    {
        Id = user.Id,
        Email = user.Email ?? string.Empty,
        FirstName = user.FirstName,
        LastName = user.LastName,
        PhoneNumber = user.PhoneNumber,
        Roles = roles.ToList(),
        MfaEnabled = user.MfaSecret?.IsConfirmed == true,
        MfaVerified = mfaVerified,
        Addresses = user.Addresses.Select(a => new AddressDto
        {
            Id = a.Id,
            Street = a.Street,
            City = a.City,
            State = a.State,
            PostalCode = a.PostalCode,
            Country = a.Country,
            IsDefault = a.IsDefault
        }).ToList()
    };
}
