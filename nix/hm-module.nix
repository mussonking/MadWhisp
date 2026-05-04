# Home-manager module for MadWhisp speech-to-text.
#
# Provides a systemd user service for autostart.
# Usage: imports = [ madwhisp.homeManagerModules.default ];
#        services.madwhisp.enable = true;
{
  config,
  lib,
  pkgs,
  ...
}:
let
  cfg = config.services.madwhisp;
in
{
  imports = [
    (lib.mkRenamedOptionModule [ "services" "handy" "enable" ] [ "services" "madwhisp" "enable" ])
    (lib.mkRenamedOptionModule [ "services" "handy" "package" ] [ "services" "madwhisp" "package" ])
  ];

  options.services.madwhisp = {
    enable = lib.mkEnableOption "MadWhisp speech-to-text user service";

    package = lib.mkOption {
      type = lib.types.package;
      defaultText = lib.literalExpression "madwhisp.packages.\${system}.madwhisp";
      description = "The MadWhisp package to use.";
    };
  };

  config = lib.mkIf cfg.enable {
    systemd.user.services.madwhisp = {
      Unit = {
        Description = "MadWhisp speech-to-text";
        After = [ "graphical-session.target" ];
        PartOf = [ "graphical-session.target" ];
      };
      Service = {
        ExecStart = "${cfg.package}/bin/madwhisp";
        Restart = "on-failure";
        RestartSec = 5;
      };
      Install.WantedBy = [ "graphical-session.target" ];
    };
  };
}
