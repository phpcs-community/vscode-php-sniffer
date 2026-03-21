{
  description = "vscode-php-sniffer development environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  };

  outputs = { self, nixpkgs }:
    let
      supportedSystems = [ "x86_64-linux" "aarch64-linux" ];
      forEachSystem = f:
        builtins.listToAttrs (map (system: {
          name = system;
          value = f system;
        }) supportedSystems);
    in
    {
      devShells = forEachSystem (system:
        let
          pkgs = import nixpkgs { inherit system; };

          # Runtime libraries required by the VS Code Electron binary
          # downloaded by @vscode/test-electron for integration testing.
          electronLibs = with pkgs; [
            alsa-lib
            at-spi2-atk
            at-spi2-core
            atk
            cairo
            cups
            dbus
            expat
            glib
            gtk3
            libdrm
            libGL
            libxkbcommon
            mesa
            nspr
            nss
            pango
            xorg.libX11
            xorg.libxcb
            xorg.libXcomposite
            xorg.libXcursor
            xorg.libXdamage
            xorg.libXext
            xorg.libXfixes
            xorg.libXi
            xorg.libXrandr
            xorg.libXScrnSaver
            xorg.libXtst
          ];
        in
        {
          default = pkgs.mkShell {
            buildInputs = [ pkgs.nodejs ] ++ electronLibs;

            shellHook = ''
              export LD_LIBRARY_PATH=${pkgs.lib.makeLibraryPath electronLibs}:''${LD_LIBRARY_PATH:-}
              # Disable the Electron sandbox (required on NixOS without user namespaces)
              export ELECTRON_DISABLE_SANDBOX=1
              # Use the downloaded VS Code Electron binary (not the NixOS-wrapped system code).
              # The LD_LIBRARY_PATH above provides the libraries it needs.
              export VSCODE_EXECUTABLE_PATH=""
            '';
          };
        });
    };
}
