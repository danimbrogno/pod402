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

RUN npm install -g nx@latest @frames.js/debugger@0.5.0 npm@latest @svgr/cli@latest

COPY fonts/googlefonts /usr/share/fonts/
RUN fc-cache -fv

USER node

ENV PATH="/usr/local/share/foundry/bin:${PATH}"

