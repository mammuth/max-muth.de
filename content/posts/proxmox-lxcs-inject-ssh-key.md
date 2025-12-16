+++
date = '2025-12-16'
title = 'Inject SSH keys into LXS when using Proxmox Helper Scripts'
author = "Max Muth"
tags = ['self-hosting', 'homelab', 'proxmox']
+++

[Proxmox Helper Scripts](https://github.com/community-scripts/ProxmoxVE) is clearly a gem, especially for quickly trying out a new tool without spending too much time configuring a production-ready setup.

One annoyance I kept stumbling upon is that I could not access the freshly created LXC via SSH, without manually adding my public key to the `authorized_keys`.

So here's a little bash snippet I use to manually copy over the PVE host's authorized keys into all LXC containers.

```bash
for CT in $(pct list | awk 'NR>1 {print $1}'); do
  pct exec $CT -- bash -c '
    mkdir -p /root/.ssh &&
    chmod 700 /root/.ssh &&
    cat > /root/.ssh/authorized_keys
  ' < /root/.ssh/authorized_keys
   pct exec $CT -- chmod 600 /root/.ssh/authorized_keys
done
```

Attention: If you just copy paste and run it, you'll override all existing `authorized_keys` files. So adjust it accordingly, if this is not what you want.
