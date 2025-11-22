FROM mcr.microsoft.com/devcontainers/typescript-node:20

#Install Rust
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs > rustup.sh \
  && chmod +x ./rustup.sh \
  && ./rustup.sh -y \
  && . "$HOME/.cargo/env"

RUN curl -L https://foundry.paradigm.xyz | bash \
  && . /root/.bashrc \
  && foundryup \
  && cp -r /root/.foundry /usr/local/share/foundry

# Install ffmpeg, ffprobe, and git-lfs
RUN apt-get update && apt-get install -y ffmpeg git-lfs && rm -rf /var/lib/apt/lists/*

# Initialize git-lfs
RUN git lfs install

# Install cloudflared
RUN curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o /usr/local/bin/cloudflared \
  && chmod +x /usr/local/bin/cloudflared

RUN npm install -g nx@latest @frames.js/debugger@0.5.0 npm@latest @svgr/cli@latest

RUN fc-cache -fv

USER node

ENV PATH="/usr/local/share/foundry/bin:${PATH}"

