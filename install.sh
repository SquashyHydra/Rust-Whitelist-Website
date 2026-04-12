#!/bin/bash
cd "$HOME"/Rust-Whitelist-Website
npm install --legacy-peer-deps
npm run prisma:generate
npm run db:push
npm run build