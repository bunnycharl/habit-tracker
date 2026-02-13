# Deployment Guide

⚠️ **IMPORTANT: This guide contains placeholders. Do NOT commit actual credentials to git!**

## Prerequisites

- VPS with Ubuntu 20.04+
- Domain configured  
- GitHub repository
- SSH access to VPS

## GitHub Secrets Setup

Go to repository → Settings → Secrets and variables → Actions

Add:
- `VPS_HOST`: Your VPS IP
- `VPS_USERNAME`: Your username
- `VPS_SSH_KEY`: Your SSH private key content

## Deployment

Application auto-deploys via GitHub Actions when pushing to `main` branch.

For manual deployment, see scripts/deploy.sh
