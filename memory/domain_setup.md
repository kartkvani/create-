# Switching the inquiry sender to @olevia.ca

Right now every inquiry email is sent from `Olevia <onboarding@resend.dev>` (Resend's shared sandbox sender). It works, but can land in spam and looks less trustworthy.

You bought `olevia.ca` — here's how to switch the "From" address to something like `hello@olevia.ca` or `notifications@olevia.ca`.

You don't need to buy Google Workspace or create a real mailbox first. Resend only needs you to prove you own the domain via DNS records. You can always add a real inbox later.

---

## Step 1 — Add the domain in Resend

1. Go to https://resend.com/domains → **Add Domain** → enter `olevia.ca`
2. Pick **Region**: `us-east-1` (default is fine)
3. Resend will show you **4 DNS records** to add. They look roughly like:

| Type  | Name                           | Value                                           |
|-------|--------------------------------|-------------------------------------------------|
| TXT   | `send.olevia.ca`               | `v=spf1 include:amazonses.com ~all`             |
| TXT   | `resend._domainkey.olevia.ca`  | `p=MIGfMA0GCSqG...` (a long DKIM public key)    |
| MX    | `send.olevia.ca`               | `feedback-smtp.us-east-1.amazonses.com` (prio 10) |
| TXT   | `_dmarc.olevia.ca`             | `v=DMARC1; p=none;`                             |

Keep this tab open — you'll copy values from here into GoDaddy.

---

## Step 2 — Add those records in GoDaddy

1. Go to https://dcc.godaddy.com/manage/olevia.ca/dns
2. Click **Add New Record** for each of the 4 records above.
3. **Important GoDaddy quirk**: in the "Name" field GoDaddy automatically appends `.olevia.ca`, so enter only the prefix:
   - For `send.olevia.ca` → enter `send`
   - For `resend._domainkey.olevia.ca` → enter `resend._domainkey`
   - For `_dmarc.olevia.ca` → enter `_dmarc`
4. For **TTL** leave the default (1 hour / 3600).
5. Save each record.

Wait 5–30 minutes. Resend auto-rechecks. When all 4 rows on the Resend domain page go **green / Verified**, you're set.

---

## Step 3 — Switch the sender in the app

Once Resend marks `olevia.ca` as **Verified**:

1. Edit `/app/backend/.env`
2. Change this line:
   ```
   SENDER_EMAIL="Olevia <onboarding@resend.dev>"
   ```
   to:
   ```
   SENDER_EMAIL="Olevia <hello@olevia.ca>"
   ```
3. Restart the backend:
   ```bash
   sudo supervisorctl restart backend
   ```

That's it. The next inquiry email will come from `Olevia <hello@olevia.ca>`, `reply-to` will still be the customer's email, so when you hit Reply in Gmail you'll reply to the customer directly. No new mailbox needed.

---

## Optional — receive email at hello@olevia.ca

Once the domain is verified in Resend, you *send* from hello@olevia.ca but emails to that address would bounce unless you set up a receiving mailbox. Two cheap options:

- **Free**: Set up **email forwarding** in GoDaddy (Email → Forwarding) and forward `hello@olevia.ca` → `kartk.vani@gmail.com`. Customers can now email you directly.
- **Paid**: Google Workspace (~$6/mo) gives you a full mailbox at hello@olevia.ca.

For now, the inquiry form already delivers customer messages straight to your Gmail, so you don't need a real mailbox at olevia.ca to start.
