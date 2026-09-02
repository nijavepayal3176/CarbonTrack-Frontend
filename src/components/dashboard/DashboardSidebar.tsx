
import {
  Avatar,
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";

import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import AddCircleOutlinedIcon from "@mui/icons-material/AddCircleOutlined";
import DevicesOutlinedIcon from "@mui/icons-material/DevicesOutlined";
import TrackChangesOutlinedIcon from "@mui/icons-material/TrackChangesOutlined";
import LeaderboardOutlinedIcon from "@mui/icons-material/LeaderboardOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";

import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

interface DashboardSidebarProps {
  onCloseMobile?: () => void;
}

const menuItems = [
  {
    label: "Dashboard",
    icon: DashboardOutlinedIcon,
    path: "/dashboard",
  },
  {
    label: "Log Activity",
    icon: AddCircleOutlinedIcon,
    path: "/activities",
  },
  {
    label: "My Devices",
    icon: DevicesOutlinedIcon,
    path: "/devices",
  },
  {
    label: "Goals",
    icon: TrackChangesOutlinedIcon,
    path: "/goals",
  },
  {
    label: "Leaderboard",
    icon: LeaderboardOutlinedIcon,
    path: "/leaderboard",
  },
  {
    label: "Eco Tips",
    icon: TrackChangesOutlinedIcon,
    path: "/eco-tips",
  },
  {
    label: "Reports",
    icon: DescriptionOutlinedIcon,
    path: "/reports",
  },
  {
    label: "AI Assistant",
    icon: AutoAwesomeRoundedIcon,
    path: "/ai-assistant",
  },
];

const DashboardSidebar = ({
  onCloseMobile,
}: DashboardSidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const { user } = useAuth();

  const getInitials = (name?: string) => {
    if (!name) {
      return "CT";
    }

    return name
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const handleMenuClick = (path: string) => {
    if (!path || path === "#") {
      return;
    }

    navigate(path);
    onCloseMobile?.();
  };

  // Profile click
  const handleProfileClick = () => {
    navigate("/profile");
    onCloseMobile?.();
  };

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "#FFFFFF",
      }}
    >
      {/* =====================================================
          LOGO
      ===================================================== */}

      <Box
        sx={{
          px: 2.3,
          py: 2.3,
          display: "flex",
          alignItems: "center",
          gap: 1.1,
        }}
      >
        <Box
          sx={{
            width: 36,
            height: 36,
            flexShrink: 0,
            borderRadius: "50%",
            background:
              "linear-gradient(135deg,#139653,#08783E)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <TrackChangesOutlinedIcon
            sx={{
              color: "#FFFFFF",
              fontSize: 23,
            }}
          />
        </Box>

        <Typography
          sx={{
            fontSize: 21,
            fontWeight: 800,
            letterSpacing: "-0.6px",
            color: "#111827",
          }}
        >
          Carbon
          <Box
            component="span"
            sx={{
              color: "#149653",
            }}
          >
            Track
          </Box>
        </Typography>
      </Box>

      {/* =====================================================
          NAVIGATION MENU
      ===================================================== */}

      <Box
        sx={{
          px: 0.7,
        }}
      >
        <List disablePadding>
          {menuItems.map((item) => {
            const Icon = item.icon;

            const active =
              location.pathname === item.path ||
              (item.path !== "/dashboard" &&
                location.pathname.startsWith(
                  `${item.path}/`
                ));

            return (
              <ListItemButton
                key={item.label}
                onClick={() =>
                  handleMenuClick(item.path)
                }
                selected={active}
                sx={{
                  minHeight: 38,
                  mb: 0.55,
                  borderRadius: "0 11px 11px 0",
                  px: 2,
                  position: "relative",

                  color: active
                    ? "#5023D4"
                    : "#263247",

                  backgroundColor: active
                    ? "#F2EEFF"
                    : "transparent",

                  transition:
                    "background-color 0.18s ease, color 0.18s ease",

                  "&::before": {
                    content: '""',
                    position: "absolute",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: active ? 4 : 0,
                    borderRadius: "0 5px 5px 0",
                    background: "#5B22D6",
                    transition: "width 0.18s ease",
                  },

                  "&:hover": {
                    backgroundColor: active
                      ? "#F2EEFF"
                      : "#F7F8FB",
                    color: active
                      ? "#5023D4"
                      : "#263247",
                  },

                  "&.Mui-selected": {
                    backgroundColor: "#F2EEFF",
                    color: "#5023D4",
                  },

                  "&.Mui-selected:hover": {
                    backgroundColor: "#F2EEFF",
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 40,
                    color: "inherit",
                  }}
                >
                  <Icon
                    sx={{
                      fontSize: 21,
                    }}
                  />
                </ListItemIcon>

                <ListItemText
                  primary={item.label}
                  slotProps={{
                    primary: {
                      sx: {
                        fontSize: 14,
                        fontWeight: active ? 700 : 500,
                        color: "inherit",
                        transition:
                          "font-weight 0.18s ease",
                      },
                    },
                  }}
                />
              </ListItemButton>
            );
          })}
        </List>
      </Box>

      {/* =====================================================
          BOTTOM USER SECTION
      ===================================================== */}

      <Box
        sx={{
          mt: "auto",
          p: 1.1,
        }}
      >
        {/* USER PROFILE CARD */}

        <Box
          onClick={handleProfileClick}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (
              event.key === "Enter" ||
              event.key === " "
            ) {
              event.preventDefault();
              handleProfileClick();
            }
          }}
          sx={{
            border: "1px solid #E7EAF0",
            borderRadius: 2.7,
            p: 1.35,
            mb: 1,

            cursor: "pointer",

            transition:
              "all 0.2s ease",

            "&:hover": {
              backgroundColor: "#F8FBF9",
              borderColor: "#D8E8DE",
              transform: "translateY(-1px)",
              boxShadow:
                "0 5px 16px rgba(20, 120, 70, 0.08)",
            },

            "&:active": {
              transform: "translateY(0)",
            },

            "&:focus-visible": {
              outline:
                "2px solid #149653",
              outlineOffset: 2,
            },
          }}
        >
          <Stack
            direction="row"
            spacing={1.1}
            sx={{
              alignItems: "center",
            }}
          >
            <Avatar
              src={
                user?.avatar || undefined
              }
              sx={{
                width: 38,
                height: 38,

                background:
                  "linear-gradient(135deg,#119452,#087A40)",

                fontSize: 13,
                fontWeight: 700,
              }}
            >
              {getInitials(user?.name)}
            </Avatar>

            <Box
              sx={{
                minWidth: 0,
                flex: 1,
              }}
            >
              <Typography
                sx={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#162033",

                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {user?.name ||
                  "CarbonTrack User"}
              </Typography>

              <Typography
                sx={{
                  fontSize: 11,
                  color: "#697386",

                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {user?.email ||
                  "user@example.com"}
              </Typography>
            </Box>
          </Stack>
        </Box>
      </Box>
    </Box>
  );
};

export default DashboardSidebar;

