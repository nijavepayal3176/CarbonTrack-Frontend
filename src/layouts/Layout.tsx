import { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

import {
  Avatar,
  Box,
  Button,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Typography,
} from "@mui/material";

import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import AddCircleOutlinedIcon from "@mui/icons-material/AddCircleOutlined";
import DevicesOutlinedIcon from "@mui/icons-material/DevicesOutlined";
import TrackChangesOutlinedIcon from "@mui/icons-material/TrackChangesOutlined";
import LeaderboardOutlinedIcon from "@mui/icons-material/LeaderboardOutlined";
import SpaOutlinedIcon from "@mui/icons-material/SpaOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import MenuOutlinedIcon from "@mui/icons-material/MenuOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";

import { useAuth } from "../context/AuthContext";

const DRAWER_WIDTH = 232;

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
    icon: SpaOutlinedIcon,
    path: "/eco-tips",
  },
  {
    label: "Reports",
    icon: DescriptionOutlinedIcon,
    path: "/reports",
  },
  {
    label: "Settings",
    icon: SettingsOutlinedIcon,
    path: "/settings",
  },
];

const Layout = () => {
  const { user, logout } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileAnchor, setProfileAnchor] =
    useState<null | HTMLElement>(null);

  const getInitials = (name?: string) => {
    if (!name) return "CT";

    return name
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setMobileOpen(false);
  };

  const handleLogout = () => {
    setProfileAnchor(null);
    logout();
  };

  const sidebarContent = (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "#FFFFFF",
      }}
    >
      {/* LOGO */}

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

      {/* MENU */}

      <Box sx={{ px: 0.7 }}>
        <List disablePadding>
          {menuItems.map((item) => {
            const Icon = item.icon;

            const active =
              location.pathname === item.path ||
              (
                item.path === "/dashboard" &&
                location.pathname === "/"
              );

            return (
              <ListItemButton
                key={item.label}
                onClick={() =>
                  handleNavigation(item.path)
                }
                sx={{
                  minHeight: 48,
                  mb: 0.55,
                  borderRadius: "0 11px 11px 0",
                  px: 2,
                  position: "relative",

                  color: active
                    ? "#5023D4"
                    : "#263247",

                  background: active
                    ? "#F2EEFF"
                    : "transparent",

                  "&::before": active
                    ? {
                        content: '""',
                        position: "absolute",
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: 4,
                        borderRadius:
                          "0 5px 5px 0",
                        background: "#5B22D6",
                      }
                    : undefined,

                  "&:hover": {
                    background: active
                      ? "#F2EEFF"
                      : "#F7F8FB",
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 40,
                    color: "inherit",
                  }}
                >
                  <Icon sx={{ fontSize: 21 }} />
                </ListItemIcon>

                <ListItemText
                  primary={item.label}
                  slotProps={{
                    primary: {
                      sx: {
                        fontSize: 14,
                        fontWeight: active
                          ? 700
                          : 500,
                      },
                    },
                  }}
                />
              </ListItemButton>
            );
          })}
        </List>
      </Box>

      {/* USER */}

      <Box
        sx={{
          mt: "auto",
          p: 1.1,
        }}
      >
        <Box
          sx={{
            border: "1px solid #E7EAF0",
            borderRadius: 2.7,
            p: 1.35,
            mb: 1,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.1,
            }}
          >
            <Avatar
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

            <Box sx={{ minWidth: 0 }}>
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
                {user?.name || "CarbonTrack User"}
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
                {user?.email || "user@example.com"}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Button
          fullWidth
          startIcon={<LogoutOutlinedIcon />}
          onClick={handleLogout}
          sx={{
            justifyContent: "flex-start",
            px: 1.5,
            py: 1.15,
            borderRadius: 2.2,
            textTransform: "none",
            color: "#087B41",
            fontWeight: 700,
            background: "#F7FCF9",
            border: "1px solid #E6EEE9",
          }}
        >
          Logout
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "#F8FAFC",
        color: "#141B2D",
      }}
    >
      {/* DESKTOP SIDEBAR */}

      <Drawer
        variant="permanent"
        sx={{
          display: {
            xs: "none",
            md: "block",
          },
          width: DRAWER_WIDTH,
          flexShrink: 0,

          "& .MuiDrawer-paper": {
            width: DRAWER_WIDTH,
            boxSizing: "border-box",
            borderRight: "1px solid #E6EAF0",
            background: "#FFFFFF",
            position: "fixed",
            height: "100vh",
          },
        }}
      >
        {sidebarContent}
      </Drawer>

      {/* MOBILE SIDEBAR */}

      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        sx={{
          display: {
            xs: "block",
            md: "none",
          },

          "& .MuiDrawer-paper": {
            width: 270,
            boxSizing: "border-box",
          },
        }}
      >
        {sidebarContent}
      </Drawer>

      {/* MAIN */}

      <Box
        sx={{
          ml: {
            xs: 0,
            md: `${DRAWER_WIDTH}px`,
          },
          minHeight: "100vh",
        }}
      >
        {/* ONE TOPBAR ONLY */}

        <Box
          sx={{
            height: 70,
            background: "#FFFFFF",
            borderBottom: "1px solid #E5E9EF",
            display: "flex",
            alignItems: "center",
            px: {
              xs: 1.5,
              md: 3,
            },
            gap: 1.5,
            position: "sticky",
            top: 0,
            zIndex: 100,
          }}
        >
          {/* MOBILE MENU */}

          <IconButton
            onClick={() => setMobileOpen(true)}
            sx={{
              display: {
                xs: "flex",
                md: "none",
              },
            }}
          >
            <MenuOutlinedIcon />
          </IconButton>

          {/* MOBILE LOGO */}

          <Typography
            sx={{
              display: {
                xs: "block",
                md: "none",
              },
              fontWeight: 800,
              fontSize: 19,
              color: "#111827",
            }}
          >
            Carbon
            <Box
              component="span"
              sx={{
                color: "#159653",
              }}
            >
              Track
            </Box>
          </Typography>

          {/* DESKTOP BRAND */}

          <Typography
            sx={{
              display: {
                xs: "none",
                md: "block",
              },
              fontWeight: 800,
              fontSize: 20,
              color: "#149653",
            }}
          >
            CarbonTrack
          </Typography>

          <Box sx={{ flex: 1 }} />

          {/* NOTIFICATIONS */}

          <IconButton>
            <NotificationsNoneOutlinedIcon
              sx={{
                fontSize: 25,
                color: "#172033",
              }}
            />
          </IconButton>

          {/* PROFILE */}

          <Button
            onClick={(event) =>
              setProfileAnchor(event.currentTarget)
            }
            sx={{
              minWidth: 0,
              textTransform: "none",
              color: "#182033",
              px: 0.5,
              borderRadius: 3,
            }}
          >
            <Avatar
              sx={{
                width: 36,
                height: 36,
                mr: 0.8,
                background:
                  "linear-gradient(135deg,#129653,#08783E)",
                fontSize: 12,
                fontWeight: 800,
              }}
            >
              {getInitials(user?.name)}
            </Avatar>

            <Typography
              sx={{
                display: {
                  xs: "none",
                  sm: "block",
                },
                fontWeight: 600,
                fontSize: 13.5,
              }}
            >
              {user?.name || "CarbonTrack User"}
            </Typography>

            <KeyboardArrowDownIcon
              sx={{
                ml: 0.3,
                fontSize: 18,
              }}
            />
          </Button>

          <Menu
            anchorEl={profileAnchor}
            open={Boolean(profileAnchor)}
            onClose={() => setProfileAnchor(null)}
          >
            <MenuItem onClick={handleLogout}>
              <LogoutOutlinedIcon
                sx={{
                  mr: 1,
                  fontSize: 19,
                }}
              />
              Logout
            </MenuItem>
          </Menu>
        </Box>

        {/* PAGE CONTENT */}

        <Box
          component="main"
          sx={{
            width: "100%",
            minHeight:
              "calc(100vh - 70px)",
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;