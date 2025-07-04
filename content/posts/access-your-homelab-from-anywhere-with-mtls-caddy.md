+++
date = '2025-06-15'
title = 'Securely Access Your Homelab From Anywhere With mTLS & Caddy'
tags = ['self-hosting', 'homelab']
+++

## Introduction - mTLS vs WireGuard or Tailscale

At some point, most people reach a stage in their homelab and self-hosting journey where they want to securely access their services while away from home - whether to access files on their OpenCloud or Immich instance, or to stream media from Jellyfin.

The most commonly recommended solution is to use a VPN like WireGuard, or more recently, third-party providers like Tailscale.

While I think these are great solutions, I want to advocate for a lesser-known alternative that has been around for many decades: **mTLS**.

**What is mTLS?**

It works by installing client TLS certificates onto your devices and configuring your reverse proxy (e.g., Caddy, NGINX Proxy Manager, etc.) to only allow requests to your upstream services **if** one of the approved client certificates is presented by the browser.

**Why is this nicer than VPNs, you may ask?**

Because once you've set up your devices, you never have to think about it again. You can just access, for example, `https://immich.example.com` from anywhere—without needing an always-on VPN.

## Caveats

mTLS works nicely when accessing your services through browsers. However, some services bring their own desktop or mobile apps, which _may_ not have mTLS support implemented.

Common apps that _do_ support mTLS in their native apps at the time of writing:

- Immich
- Vaultwarden
- Nextcloud

Common apps that do not support it:

- Jellyfin

## Setup

The following guides you how to set it up yourself.

The steps are

- Install and set up Caddy (not covered in this post)
- Generate the certificates
- Configure Caddy to enforce the certificates
- Configure your clients (mobile phones and PCs)

### Generate CA & client certificate

Connect to your caddy instance and create a folder where we'll store the certificates:

```bash
mkdir -p /etc/caddy/mtls
cd /etc/caddy/mtls
```

Generate a certificate authority:

```bash
openssl ecparam -genkey -name secp256r1 | openssl ec -out ca.key
openssl req -new -x509 -days 36500 -key ca.key -out ca.pem -subj "/CN=HomeLab Wildcard CA"
```

The information provided don't really matter.

Generate a signing request

```bash
openssl ecparam -genkey -name secp256r1 | openssl ec -out homelab.key
openssl req -new -key homelab.key -out mhomelab.csr
```

Important: When being prompted for the common name, provide your wildcard domain, eg. `*.home.your-domain.com`
The other questions you're being asked don't matter.

Generate a client certificate by signing client CSR with the CA root. Adjust the validity to your liking.

```bash
openssl x509 -req -days 36500 -in homelab.csr -CA ca.pem -CAkey ca.key -out homelab.crt
```

Generate a p12 bundle

```bash
certtool --load-privkey homelab.key --load-certificate homelab.crt --load-ca-certificate ca.pem --to-p12 --outder --outfile homelab.p12 --p12-name "homelab" --hash SHA1
```

Provide a password when being asked to.

When trying to import that p12 cert into the MacOS keychain, I received the error `Unable to decode the provided data.`
A valid workaround was to generate a p12 using openssl's `--legacy` flag

```bash
openssl pkcs12 -export -in homelab.crt -inkey homelab.key -out homelab_legacy_format.p12 -legacy
```

**Notes on security**

_Ideally_, you create a client certificate for each device or at least for each person. And ideally, you also let them _expire_ at some point. However, that makes handling certificate renewals with your family and friends a bit more cumbersome, obviously.

### Configure Caddy

Adjust your Caddyfile like this:

```
(require_client_certificate) {
  tls {
    client_auth {
      # Require clients to present a valid certificate that is verified
      mode require_and_verify
      trusted_ca_cert_file /etc/caddy/certs/ca.pem
    }
  }
}

immich.your-domain.de {
	import require_client_certificate
	reverse_proxy http://immich.local:8080
}
```

Note: Ensure that your services are _not_ accessible by HTTP. Caddy will redirect by default unless you changed it, though.

This assumes, that you already exposed caddy to the internet via the port forwardings on your router.

### Import the certificates into your devices

**Android**

Just click on the p12 and install it as a "VPN & Apps" certificate. If you receive an error, try the legacy format p12.

**macOS**

Just double-click the p12 to add it to your keychain. If you receive an error, try generating the legacy format p12.
