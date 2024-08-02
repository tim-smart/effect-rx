{
  inputs = {
    nixpkgs = {
      url = "github:nixos/nixpkgs/nixpkgs-unstable";
    };

    flake-utils = {
      url = "github:numtide/flake-utils";
    };
  };

  outputs = {
    self,
    nixpkgs,
    flake-utils,
    ...
  }:
    flake-utils.lib.eachDefaultSystem (system: let
      pkgs = nixpkgs.legacyPackages.${system};
      node = pkgs.nodejs_22;
      corepackEnable = pkgs.runCommand "corepack-enable" {} ''
        mkdir -p $out/bin
        ${node}/bin/corepack enable --install-directory $out/bin
      '';
    in {
      formatter = pkgs.alejandra;
      devShells = {
        default = pkgs.mkShell {
          buildInputs = with pkgs; [
            node
            corepackEnable
          ];
        };
      };
    });
}
