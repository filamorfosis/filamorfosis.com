$content = Get-Content -Path 'assets/js/products.js' -Raw -Encoding UTF8

# Fix 1: label inline style
$old1 = '                        <label class="modal-variant-check-wrap" style="display:flex;align-items:center;gap:10px;flex:1;cursor:${available ? ''pointer'' : ''default''}">'
$new1 = '                        <label class="modal-variant-check-wrap${!available ? '' modal-variant-check-wrap--disabled'' : ''}">'
$content = $content.Replace($old1, $new1)

# Fix 2: checkbox inline style
$old2 = '                                   ${!available ? ''disabled'' : ''}
                                   style="width:17px;height:17px;accent-color:#8b5cf6;cursor:${available ? ''pointer'' : ''not-allowed''};flex-shrink:0">'
$new2 = '                                   ${!available ? ''disabled'' : ''}>'
$content = $content.Replace($old2, $new2)

# Fix 3: price-original span inline style
$old3 = '                                <span style="text-decoration:line-through;color:#64748b;font-size:1rem;margin-right:2px">${Math.round(v.price)}</span>'
$new3 = '                                <span class="modal-variant-price-original">${Math.round(v.price)}</span>'
$content = $content.Replace($old3, $new3)

# Fix 4: price-effective span inline style
$old4 = '                                <span style="color:#fb923c;font-weight:700">${Math.round(effectivePrice)} MXN</span>'
$new4 = '                                <span class="modal-variant-price-effective">${Math.round(effectivePrice)} MXN</span>'
$content = $content.Replace($old4, $new4)

# Fix 5: badge-red Agotado inline style
$old5 = '<span class="badge badge-red" style="font-size:1rem">Agotado</span>'
$new5 = '<span class="badge badge-red modal-variant-status-badge">Agotado</span>'
$content = $content.Replace($old5, $new5)

# Fix 6: badge-red No disponible inline style
$old6 = '<span class="badge badge-red" style="font-size:1rem">No disponible</span>'
$new6 = '<span class="badge badge-red modal-variant-status-badge">No disponible</span>'
$content = $content.Replace($old6, $new6)

# Fix 7: qty-dec button inline style
$old7 = '                            <button type="button" class="qty-btn qty-dec" style="width:26px;height:26px;border-radius:6px;border:1px solid #334155;background:#1e293b;color:#e2e8f0;cursor:pointer;font-size:1rem;line-height:1">−</button>'
$new7 = '                            <button type="button" class="qty-btn qty-dec modal-qty-btn">−</button>'
$content = $content.Replace($old7, $new7)

# Fix 8: qty input inline style
$old8 = '                            <input type="number" class="variant-qty" value="1" min="1" max="99"
                                   style="width:44px;text-align:center;background:#1e293b;border:1px solid #334155;color:#f1f5f9;border-radius:6px;padding:3px 4px;font-size:1rem">'
$new8 = '                            <input type="number" class="variant-qty modal-qty-input" value="1" min="1" max="99">'
$content = $content.Replace($old8, $new8)

# Fix 9: qty-inc button inline style
$old9 = '                            <button type="button" class="qty-btn qty-inc" style="width:26px;height:26px;border-radius:6px;border:1px solid #334155;background:#1e293b;color:#e2e8f0;cursor:pointer;font-size:1rem;line-height:1">+</button>'
$new9 = '                            <button type="button" class="qty-btn qty-inc modal-qty-btn">+</button>'
$content = $content.Replace($old9, $new9)

# Fix 10: empty variants paragraph inline style
$old10 = '<p style="color:#94a3b8;padding:12px 0">Sin variantes disponibles</p>'
$new10 = '<p class="modal-variants-empty">Sin variantes disponibles</p>'
$content = $content.Replace($old10, $new10)

# Fix 11: WhatsApp icon inline style in modal
$old11 = '<i class="fab fa-whatsapp" style="color:#25d366"></i>'
$new11 = '<i class="fab fa-whatsapp modal-wa-icon"></i>'
$content = $content.Replace($old11, $new11)

[System.IO.File]::WriteAllText('assets/js/products.js', $content, [System.Text.Encoding]::UTF8)
Write-Host "Done - products.js fixed"
