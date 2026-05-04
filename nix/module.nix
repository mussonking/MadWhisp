# NixOS module for MadWhisp speech-to-text.
#
# Handles system-level configuration that the package wrapper cannot:
# - udev rule for /dev/uinput (rdev grab() needs it for virtual input)
#
# Users must add themselves to the "input" group for evdev hotkey access.
#
# Usage in your flake:
#
#   inputs.madwhisp.url = "github:mussonking/MadWhisp";
#
#   nixosConfigurations.myhost = nixpkgs.lib.nixosSystem {
#     modules = [
#       madwhisp.nixosModules.default
#       { programs.madwhisp.enable = true; }
#     ];
#   };
{
  config,
  lib,
  pkgs,
  ...
}:
let
  cfg = config.programs.madwhisp;
in
{
  imports = [
    (lib.mkRenamedOptionModule [ "programs" "handy" "enable" ] [ "programs" "madwhisp" "enable" ])
    (lib.mkRenamedOptionModule [ "programs" "handy" "package" ] [ "programs" "madwhisp" "package" ])
  ];

  options.programs.madwhisp = {
    enable = lib.mkEnableOption "MadWhisp offline speech-to-text";

    package = lib.mkOption {
      type = lib.types.package;
      defaultText = lib.literalExpression "madwhisp.packages.\${system}.madwhisp";
      description = "The MadWhisp package to use.";
    };
  };

  config = lib.mkIf cfg.enable {
    environment.systemPackages = [ cfg.package ];

    services.udev.extraRules = ''
      KERNEL=="uinput", GROUP="input", MODE="0660"
    '';
  };
}
