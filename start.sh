#!/bin/bash
cd "$HOME"/Rust-Whitelist-Website
nohup npm run start $> website.log 2>&1 &