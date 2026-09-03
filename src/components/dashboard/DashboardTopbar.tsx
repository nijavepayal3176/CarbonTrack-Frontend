import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  TextField,
  Typography,
} from "@mui/material";

import TrackChangesOutlinedIcon from "@mui/icons-material/TrackChangesOutlined";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import MenuOutlinedIcon from "@mui/icons-material/MenuOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import DoneAllRoundedIcon from "@mui/icons-material/DoneAllRounded";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  KeyboardEvent,
  MouseEvent,
} from "react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  fetchNotificationData,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  NOTIFICATIONS_UPDATE_EVENT,
} from "../../utils/notifications";

import { useAuth } from "../../context/AuthContext";

interface NotificationItem {
  id: string;
  title: string;
  message: string;

  /*
   * Older notification format may use `read`
   * while the newer UI uses `seen`.
   *
   * Both are supported safely.
   */
  seen?: boolean;
  read?: boolean;

  createdAt: string;
  type?: string;
}

interface DashboardTopbarProps {
  onMobileMenu: () => void;
  loading?: boolean;
  onRefresh?: () => void;
  notificationCount?: number;
}

const DashboardTopbar = ({
  onMobileMenu,
  loading = false,
  onRefresh,
  notificationCount = 0,
}: DashboardTopbarProps) => {
  const { user, logout } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const [profileAnchor, setProfileAnchor] =
    useState<null | HTMLElement>(null);

  const [notificationAnchor, setNotificationAnchor] =
    useState<null | HTMLElement>(null);

  const [searchValue, setSearchValue] =
    useState("");

  const [searchFocused, setSearchFocused] =
    useState(false);

  const [notifications, setNotifications] =
    useState<NotificationItem[]>([]);

  /*
   * =========================================================
   * NOTIFICATION HELPERS
   * =========================================================
   */

  /*
   * A notification is considered seen when either
   * `seen === true` OR `read === true`.
   */
  const isNotificationSeen = (
    notification: NotificationItem
  ) => {
    return (
      notification.seen === true ||
      notification.read === true
    );
  };

  /*
   * =========================================================
   * INITIAL NOTIFICATION LOAD + LIVE UPDATES
   * =========================================================
   */

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const result =
          await fetchNotificationData();

        if (mounted) {
          setNotifications(
            result.notifications
          );
        }
      } catch (error) {
        console.error(
          "CarbonTrack: notification loading error:",
          error
        );
      }
    };

    load();

    /*
     * Live refresh:
     * backend-generated notifications become
     * visible without manually refreshing page.
     */
    const intervalId =
      window.setInterval(
        load,
        60000
      );

    const handleNotificationUpdate =
      () => {
        load();
      };

    window.addEventListener(
      NOTIFICATIONS_UPDATE_EVENT,
      handleNotificationUpdate
    );

    window.addEventListener(
      "storage",
      handleNotificationUpdate
    );

    return () => {
      mounted = false;

      window.clearInterval(
        intervalId
      );

      window.removeEventListener(
        NOTIFICATIONS_UPDATE_EVENT,
        handleNotificationUpdate
      );

      window.removeEventListener(
        "storage",
        handleNotificationUpdate
      );
    };
  }, []);

  /*
   * =========================================================
   * SAFE NOTIFICATION DATA
   * =========================================================
   */

  const safeNotifications =
    Array.isArray(notifications)
      ? notifications
      : [];

  const unreadNotifications =
    safeNotifications.filter(
      (notification) =>
        !isNotificationSeen(notification)
    );

  const unreadCount =
    safeNotifications.length > 0
      ? unreadNotifications.length
      : Math.max(
          0,
          Number(notificationCount) || 0
        );

  /*
   * =========================================================
   * MARK ONE AS SEEN
   * =========================================================
   */

  const markNotificationAsSeen =
    async (
      notificationId: string
    ) => {
      const success =
        await markNotificationAsRead(
          notificationId
        );

      if (!success) {
        return;
      }

      setNotifications(
        (previous) =>
          previous.map(
            (notification) =>
              notification.id ===
              notificationId
                ? {
                    ...notification,
                    seen: true,
                    read: true,
                  }
                : notification
          )
      );
    };

  /*
   * =========================================================
   * MARK ALL AS SEEN
   * =========================================================
   */

  const markAllNotificationsAsSeen =
    async () => {
      const success =
        await markAllNotificationsAsRead();

      if (!success) {
        return;
      }

      setNotifications(
        (previous) =>
          previous.map(
            (notification) => ({
              ...notification,
              seen: true,
              read: true,
            })
          )
      );
    };

  /*
   * =========================================================
   * NOTIFICATION BELL
   * =========================================================
   *
   * IMPORTANT:
   * Clicking notification NEVER calls logout().
   */

  const handleNotificationClick = (
    event: MouseEvent<HTMLElement>
  ) => {
    event.preventDefault();
    event.stopPropagation();

    setNotificationAnchor(
      event.currentTarget
    );
  };

  const closeNotificationMenu = () => {
    setNotificationAnchor(null);
  };

  /*
   * =========================================================
   * VIEW ALL
   * =========================================================
   *
   * We intentionally do NOT navigate to `/notifications`
   * here because if App.tsx does not contain that route,
   * React Router's `*` route redirects to `/login`.
   *
   * Instead, all notifications are marked seen and the
   * notification menu remains safely inside the dashboard.
   *
   * This prevents the false "logout" behaviour.
   */

  const openNotificationsPage = () => {
    markAllNotificationsAsSeen();
    closeNotificationMenu();

    /*
     * Only navigate if the Notifications page route
     * already exists in the current application.
     *
     * Since the current App.tsx does not define it,
     * we safely stay on the current page.
     */
    if (
      location.pathname ===
      "/notifications"
    ) {
      return;
    }

    /*
     * Do not navigate to an undefined route.
     *
     * This is the actual reason the previous
     * implementation appeared to logout.
     */
  };

  /*
   * =========================================================
   * PROFILE
   * =========================================================
   */

  const getInitials = (
    name?: string
  ) => {
    if (!name) {
      return "CT";
    }

    return name
      .trim()
      .split(/\s+/)
      .map(
        (part) => part[0]
      )
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  /*
   * =========================================================
   * PAGE TITLE
   * =========================================================
   */

  const pageTitle = useMemo(() => {
    const path = location.pathname;

    if (
      path === "/dashboard" ||
      path === "/"
    ) {
      return "Dashboard";
    }

    if (
      path.startsWith(
        "/activities"
      )
    ) {
      return "Activities";
    }

    if (
      path.startsWith("/devices")
    ) {
      return "My Devices";
    }

    if (
      path.startsWith("/goals")
    ) {
      return "Goals";
    }

    if (
      path.startsWith(
        "/leaderboard"
      )
    ) {
      return "Leaderboard";
    }

    if (
      path.startsWith(
        "/eco-tips"
      )
    ) {
      return "Eco Tips";
    }

    if (
      path.startsWith("/reports")
    ) {
      return "Reports";
    }

    if (
      path.startsWith("/settings")
    ) {
      return "Settings";
    }

    if (
      path.startsWith("/profile")
    ) {
      return "Profile";
    }

    if (
      path.startsWith(
        "/notifications"
      )
    ) {
      return "Notifications";
    }

    if (
      path.startsWith(
        "/ai-assistant"
      )
    ) {
      return "CarbonTrack AI";
    }

    return "Dashboard";
  }, [location.pathname]);

  /*
   * =========================================================
   * AI SEARCH
   * =========================================================
   */

  const suggestions = [
    {
      label:
        "Analyze my carbon footprint",
      question:
        "Analyze my carbon footprint and tell me what I should improve first.",
    },
    {
      label:
        "Find my biggest emission",
      question:
        "Which category is causing the most emissions in my activities?",
    },
    {
      label:
        "How can I reduce my emissions?",
      question:
        "How can I reduce my carbon emissions based on my activity data?",
    },
    {
      label:
        "Give me personalized eco tips",
      question:
        "Give me practical sustainability tips based on my activity data.",
    },
  ];

  const filteredSuggestions =
    searchValue.trim()
      ? suggestions.filter(
          (item) =>
            item.label
              .toLowerCase()
              .includes(
                searchValue
                  .trim()
                  .toLowerCase()
              )
        )
      : suggestions;

  const openAIAssistant = (
    question?: string
  ) => {
    const cleanQuestion =
      question?.trim() || "";

    setSearchFocused(false);

    if (cleanQuestion) {
      navigate(
        `/ai-assistant?question=${encodeURIComponent(
          cleanQuestion
        )}`
      );

      return;
    }

    navigate("/ai-assistant");
  };

  const handleSearchSubmit = () => {
    const cleanQuestion =
      searchValue.trim();

    if (!cleanQuestion) {
      openAIAssistant();
      return;
    }

    openAIAssistant(
      cleanQuestion
    );
  };

  const handleSearchKeyDown = (
    event: KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleSearchSubmit();
    }

    if (event.key === "Escape") {
      setSearchFocused(false);
    }
  };

  /*
   * =========================================================
   * LOGOUT
   * =========================================================
   *
   * This is the ONLY place where logout() is called.
   */

  const handleLogout = () => {
    setProfileAnchor(null);
    logout();
  };

  /*
   * =========================================================
   * NOTIFICATION TIME
   * =========================================================
   */

  const formatNotificationTime = (
    dateString: string
  ) => {
    try {
      const date =
        new Date(dateString);

      if (
        Number.isNaN(
          date.getTime()
        )
      ) {
        return "";
      }

      const now = new Date();

      const difference =
        now.getTime() -
        date.getTime();

      const minutes =
        Math.floor(
          difference / 60000
        );

      if (minutes < 1) {
        return "Just now";
      }

      if (minutes < 60) {
        return `${minutes} min ago`;
      }

      const hours =
        Math.floor(
          minutes / 60
        );

      if (hours < 24) {
        return `${hours} hr${
          hours > 1 ? "s" : ""
        } ago`;
      }

      const days =
        Math.floor(
          hours / 24
        );

      if (days === 1) {
        return "Yesterday";
      }

      if (days < 7) {
        return `${days} days ago`;
      }

      return date.toLocaleDateString(
        "en-IN",
        {
          day: "numeric",
          month: "short",
        }
      );
    } catch {
      return "";
    }
  };

  return (
    <Box
      sx={{
        height: {
          xs: 64,
          sm: 68,
          md: 70,
        },

        background: "#FFFFFF",

        borderBottom:
          "1px solid #E5E9EF",

        display: "flex",
        alignItems: "center",

        px: {
          xs: 1,
          sm: 1.8,
          md: 2.5,
          lg: 3,
        },

        gap: {
          xs: 0.7,
          sm: 1,
          md: 1.5,
        },

        position: "sticky",
        top: 0,

        zIndex: 1100,
      }}
    >
      {/* =====================================================
          MOBILE MENU
      ===================================================== */}

      <IconButton
        onClick={onMobileMenu}
        sx={{
          display: {
            xs: "flex",
            md: "none",
          },

          width: 40,
          height: 40,

          color: "#43564C",

          borderRadius: 2,

          "&:hover": {
            background: "#F1F8F4",
            color: "#168A52",
          },
        }}
      >
        <MenuOutlinedIcon />
      </IconButton>

      {/* =====================================================
          MOBILE LOGO
      ===================================================== */}

      <Typography
        sx={{
          display: {
            xs: "block",
            md: "none",
          },

          fontWeight: 800,

          fontSize: {
            xs: 17,
            sm: 18,
          },

          color: "#17231D",

          letterSpacing: "-0.35px",

          whiteSpace: "nowrap",
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

      {/* =====================================================
          DESKTOP PAGE TITLE
      ===================================================== */}

      <Typography
        sx={{
          display: {
            xs: "none",
            md: "block",
          },

          minWidth: {
            md: 125,
            lg: 140,
          },

          fontSize: {
            md: 18,
            lg: 19,
          },

          fontWeight: 750,

          color: "#138548",

          letterSpacing: "-0.25px",

          whiteSpace: "nowrap",
        }}
      >
        {pageTitle}
      </Typography>

      {/* =====================================================
          DESKTOP AI SEARCH
      ===================================================== */}

      <Box
        sx={{
          position: "relative",

          display: {
            xs: "none",
            md: "block",
          },

          flex: {
            md: "0 1 330px",
            lg: "0 1 380px",
          },

          minWidth: 0,

          ml: {
            md: 1,
          },
        }}
      >
        <Paper
          elevation={0}
          onClick={() => {
            setSearchFocused(true);
          }}
          sx={{
            height: 43,

            display: "flex",
            alignItems: "center",

            borderRadius: 2.4,

            background:
              searchFocused
                ? "#FFFFFF"
                : "#F8FBF9",

            border:
              searchFocused
                ? "1px solid rgba(21,150,83,0.42)"
                : "1px solid #E0E9E4",

            boxShadow:
              searchFocused
                ? "0 0 0 3px rgba(21,150,83,0.07), 0 7px 22px rgba(31,75,50,0.07)"
                : "0 3px 14px rgba(30,75,49,0.025)",

            transition:
              "all 180ms ease",

            cursor: "text",

            "&:hover": {
              borderColor: "#C8DCD0",

              background: "#FFFFFF",

              boxShadow:
                "0 5px 18px rgba(30,75,49,0.06)",
            },
          }}
        >
          <Box
            sx={{
              width: 36,
              height: "100%",

              display: "flex",
              alignItems: "center",
              justifyContent: "center",

              flexShrink: 0,
            }}
          >
            <AutoAwesomeRoundedIcon
              sx={{
                fontSize: 19,

                color:
                  searchFocused
                    ? "#168A52"
                    : "#55A978",

                transition:
                  "color 180ms ease",
              }}
            />
          </Box>

          <TextField
            fullWidth
            value={searchValue}
            onChange={(event) =>
              setSearchValue(
                event.target.value
              )
            }
            onFocus={() =>
              setSearchFocused(true)
            }
            onKeyDown={
              handleSearchKeyDown
            }
            placeholder="Ask CarbonTrack AI..."
            variant="standard"
            slotProps={{
              input: {
                disableUnderline: true,
              },
            }}
            sx={{
              minWidth: 0,

              "& .MuiInputBase-root": {
                height: "100%",

                fontSize: {
                  md: "0.78rem",
                  lg: "0.81rem",
                },

                color: "#31483C",

                fontWeight: 500,
              },

              "& .MuiInputBase-input": {
                padding: "0 4px",

                textOverflow:
                  "ellipsis",
              },

              "& .MuiInputBase-input::placeholder":
                {
                  color: "#8A9991",
                  opacity: 1,
                },
            }}
          />

          <IconButton
            onClick={(event) => {
              event.stopPropagation();
              handleSearchSubmit();
            }}
            aria-label="Search with CarbonTrack AI"
            sx={{
              width: 34,
              height: 34,

              mr: 0.4,

              flexShrink: 0,

              borderRadius: 1.8,

              color:
                searchValue.trim()
                  ? "#168A52"
                  : "#81958A",

              background:
                searchValue.trim()
                  ? "#EAF7EF"
                  : "transparent",

              transition:
                "all 160ms ease",

              "&:hover": {
                background: "#EAF7EF",

                color: "#168A52",

                transform:
                  "translateY(-1px)",
              },
            }}
          >
            <SearchOutlinedIcon
              sx={{
                fontSize: 19,
              }}
            />
          </IconButton>
        </Paper>

        {/* ===================================================
            SEARCH SUGGESTIONS
        =================================================== */}

        {searchFocused && (
          <>
            <Box
              onClick={() =>
                setSearchFocused(false)
              }
              sx={{
                position: "fixed",
                inset: 0,
                zIndex: -1,
              }}
            />

            <Paper
              elevation={0}
              sx={{
                position: "absolute",

                top: "calc(100% + 8px)",

                left: 0,
                right: 0,

                borderRadius: 2.5,

                background: "#FFFFFF",

                border:
                  "1px solid #E0EAE4",

                boxShadow:
                  "0 18px 45px rgba(24,65,43,0.12)",

                overflow: "hidden",

                zIndex: 1200,

                animation:
                  "searchDropdownIn 160ms ease-out",

                "@keyframes searchDropdownIn":
                  {
                    from: {
                      opacity: 0,
                      transform:
                        "translateY(-4px)",
                    },

                    to: {
                      opacity: 1,
                      transform:
                        "translateY(0)",
                    },
                  },
              }}
            >
              <Box
                sx={{
                  px: 1.5,
                  pt: 1.3,
                  pb: 0.7,

                  display: "flex",
                  alignItems: "center",

                  gap: 0.8,
                }}
              >
                <AutoAwesomeRoundedIcon
                  sx={{
                    fontSize: 16,
                    color: "#45A773",
                  }}
                />

                <Typography
                  sx={{
                    fontSize: "0.67rem",
                    fontWeight: 750,
                    color: "#72857A",
                    letterSpacing:
                      "0.15px",
                  }}
                >
                  Ask CarbonTrack AI
                </Typography>
              </Box>

              {filteredSuggestions.length >
              0 ? (
                filteredSuggestions.map(
                  (item) => (
                    <Box
                      key={item.label}
                      onClick={() =>
                        openAIAssistant(
                          item.question
                        )
                      }
                      sx={{
                        px: 1.4,
                        py: 1,

                        display: "flex",
                        alignItems:
                          "center",

                        gap: 1,

                        cursor: "pointer",

                        transition:
                          "background 150ms ease",

                        "&:hover": {
                          background:
                            "#F4FAF6",

                          "& .suggestion-arrow":
                            {
                              opacity: 1,
                              transform:
                                "translateX(2px)",
                            },
                        },
                      }}
                    >
                      <Box
                        sx={{
                          width: 31,
                          height: 31,

                          borderRadius: 1.8,

                          display: "flex",
                          alignItems:
                            "center",
                          justifyContent:
                            "center",

                          flexShrink: 0,

                          background:
                            "#EDF8F1",

                          color:
                            "#168A52",
                        }}
                      >
                        <SearchOutlinedIcon
                          sx={{
                            fontSize: 17,
                          }}
                        />
                      </Box>

                      <Typography
                        sx={{
                          flex: 1,
                          minWidth: 0,

                          fontSize:
                            "0.73rem",

                          fontWeight: 600,

                          color: "#40574B",

                          overflow:
                            "hidden",

                          textOverflow:
                            "ellipsis",

                          whiteSpace:
                            "nowrap",
                        }}
                      >
                        {item.label}
                      </Typography>

                      <ArrowForwardRoundedIcon
                        className="suggestion-arrow"
                        sx={{
                          fontSize: 16,

                          color: "#79A78E",

                          opacity: 0,

                          transition:
                            "all 150ms ease",
                        }}
                      />
                    </Box>
                  )
                )
              ) : (
                <Box
                  sx={{
                    px: 1.5,
                    py: 1.5,
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: "0.72rem",
                      color: "#819087",
                    }}
                  >
                    Press Enter to ask
                    CarbonTrack AI about
                    this.
                  </Typography>
                </Box>
              )}

              <Box
                sx={{
                  px: 1.5,
                  py: 0.9,

                  borderTop:
                    "1px solid #EEF3F0",

                  background:
                    "#FBFDFC",
                }}
              >
                <Typography
                  sx={{
                    fontSize: "0.6rem",

                    color: "#9AA79F",

                    textAlign: "center",
                  }}
                >
                  Enter to search • Esc
                  to close
                </Typography>
              </Box>
            </Paper>
          </>
        )}
      </Box>

      {/* =====================================================
          MOBILE / TABLET AI SEARCH ICON
      ===================================================== */}

      <IconButton
        onClick={() =>
          openAIAssistant()
        }
        aria-label="Open CarbonTrack AI"
        sx={{
          display: {
            xs: "flex",
            md: "none",
          },

          width: {
            xs: 36,
            sm: 40,
          },

          height: {
            xs: 36,
            sm: 40,
          },

          p: 0,

          ml: "auto",

          color: "#168A52",

          background: "transparent",

          border: "none",

          boxShadow: "none",

          borderRadius: "50%",

          "&:hover": {
            background:
              "rgba(22,138,82,0.07)",

            color: "#117646",
          },

          "&:active": {
            background:
              "rgba(22,138,82,0.12)",
          },
        }}
      >
        <AutoAwesomeRoundedIcon
          sx={{
            fontSize: {
              xs: 21,
              sm: 23,
            },
          }}
        />
      </IconButton>

      {/* =====================================================
          SPACER
      ===================================================== */}

      <Box
        sx={{
          flex: 1,

          minWidth: {
            xs: 0,
            md: 8,
          },
        }}
      />

      {/* =====================================================
          REFRESH
      ===================================================== */}

      {onRefresh && (
        <IconButton
          onClick={onRefresh}
          disabled={loading}
          title="Refresh"
          sx={{
            display: {
              xs: "none",
              sm: "flex",
            },

            width: 38,
            height: 38,

            color: "#526071",

            borderRadius: 2,

            "&:hover": {
              background: "#F3F7F5",
              color: "#168A52",
            },
          }}
        >
          {loading ? (
            <CircularProgress
              size={19}
            />
          ) : (
            <TrackChangesOutlinedIcon
              sx={{
                color: "inherit",
                fontSize: 21,
              }}
            />
          )}
        </IconButton>
      )}

      {/* =====================================================
          NOTIFICATIONS
      ===================================================== */}

      <IconButton
        onClick={
          handleNotificationClick
        }
        aria-label="Notifications"
        sx={{
          position: "relative",

          width: {
            xs: 38,
            sm: 40,
          },

          height: {
            xs: 38,
            sm: 40,
          },

          borderRadius: 2,

          color: "#172033",

          "&:hover": {
            background: "#F3F7F5",
          },

          "&:active": {
            background: "#EAF5EF",
          },
        }}
      >
        <NotificationsNoneOutlinedIcon
          sx={{
            fontSize: {
              xs: 22,
              sm: 24,
            },

            color:
              unreadCount > 0
                ? "#168A52"
                : "#172033",
          }}
        />

        {unreadCount > 0 && (
          <Box
            sx={{
              position: "absolute",

              right: 2,
              top: 1,

              minWidth: 16,
              height: 16,

              px:
                unreadCount > 9
                  ? 0.35
                  : 0,

              borderRadius: "50%",

              background: "#ED1C24",

              color: "#FFFFFF",

              display: "flex",
              alignItems: "center",
              justifyContent:
                "center",

              fontSize: 9,

              fontWeight: 800,

              border:
                "2px solid #FFFFFF",

              lineHeight: 1,
            }}
          >
            {Math.min(
              unreadCount,
              99
            )}
          </Box>
        )}
      </IconButton>

      {/* =====================================================
          NOTIFICATION MENU
      ===================================================== */}

      <Menu
        anchorEl={notificationAnchor}
        open={Boolean(notificationAnchor)}
        onClose={closeNotificationMenu}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        slotProps={{
          paper: {
            sx: {
              mt: 1,

              width: {
                xs: "calc(100vw - 24px)",
                sm: 370,
              },

              maxWidth: 370,
              maxHeight: 470,

              borderRadius: 2.8,

              border:
                "1px solid #E3EBE6",

              boxShadow:
                "0 18px 50px rgba(20,55,38,0.14)",

              overflow: "hidden",

              p: 0,
            },
          },
        }}
      >
        {/* HEADER */}

        <Box
          sx={{
            px: 2,

            py: 1.5,

            display: "flex",

            alignItems: "center",

            justifyContent:
              "space-between",

            background:
              "#FBFDFC",
          }}
        >
          <Box>
            <Typography
              sx={{
                fontSize: 14,

                fontWeight: 800,

                color: "#17231D",
              }}
            >
              Notifications
            </Typography>

            <Typography
              sx={{
                fontSize: 11,

                color: "#7A8981",

                mt: 0.25,
              }}
            >
              {unreadCount > 0
                ? `${unreadCount} unread`
                : "You're all caught up"}
            </Typography>
          </Box>

          {unreadCount > 0 && (
            <IconButton
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();

                markAllNotificationsAsSeen();
              }}
              title="Mark all as read"
              sx={{
                width: 34,
                height: 34,

                color: "#168A52",

                borderRadius: 1.8,

                "&:hover": {
                  background:
                    "#EAF7EF",
                },
              }}
            >
              <DoneAllRoundedIcon
                sx={{
                  fontSize: 19,
                }}
              />
            </IconButton>
          )}
        </Box>

        <Divider />

        {/* NOTIFICATION LIST */}

        {safeNotifications.length >
        0 ? (
          safeNotifications
            .slice()
            .sort(
              (a, b) =>
                new Date(
                  b.createdAt
                ).getTime() -
                new Date(
                  a.createdAt
                ).getTime()
            )
            .slice(0, 8)
            .map(
              (notification) => {
                const seen =
                  isNotificationSeen(
                    notification
                  );

                return (
                  <MenuItem
                    key={
                      notification.id
                    }
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();

                      markNotificationAsSeen(
                        notification.id
                      );
                    }}
                    sx={{
                      px: 1.7,

                      py: 1.35,

                      alignItems:
                        "flex-start",

                      gap: 1.15,

                      background: seen
                        ? "#FFFFFF"
                        : "#F3FAF6",

                      borderBottom:
                        "1px solid #F0F3F1",

                      whiteSpace:
                        "normal",

                      transition:
                        "background 150ms ease",

                      "&:hover": {
                        background:
                          "#ECF7F0",
                      },
                    }}
                  >
                    {/* ICON */}

                    <Box
                      sx={{
                        width: 34,
                        height: 34,

                        mt: 0.1,

                        borderRadius: 1.8,

                        flexShrink: 0,

                        display: "flex",

                        alignItems:
                          "center",

                        justifyContent:
                          "center",

                        background: seen
                          ? "#F1F4F2"
                          : "#E0F3E8",

                        color: seen
                          ? "#829189"
                          : "#168A52",
                      }}
                    >
                      {seen ? (
                        <CheckCircleOutlineRoundedIcon
                          sx={{
                            fontSize: 18,
                          }}
                        />
                      ) : (
                        <NotificationsNoneOutlinedIcon
                          sx={{
                            fontSize: 18,
                          }}
                        />
                      )}
                    </Box>

                    {/* CONTENT */}

                    <Box
                      sx={{
                        minWidth: 0,

                        flex: 1,
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",

                          alignItems:
                            "flex-start",

                          justifyContent:
                            "space-between",

                          gap: 1,
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: 12.5,

                            fontWeight: seen
                              ? 600
                              : 750,

                            color:
                              "#263B31",

                            lineHeight: 1.35,
                          }}
                        >
                          {
                            notification.title
                          }
                        </Typography>

                        {!seen && (
                          <Box
                            sx={{
                              width: 7,
                              height: 7,

                              mt: 0.55,

                              borderRadius:
                                "50%",

                              background:
                                "#168A52",

                              flexShrink: 0,
                            }}
                          />
                        )}
                      </Box>

                      <Typography
                        sx={{
                          mt: 0.35,

                          fontSize: 11.2,

                          color: "#6F7F76",

                          lineHeight: 1.45,
                        }}
                      >
                        {
                          notification.message
                        }
                      </Typography>

                      <Typography
                        sx={{
                          mt: 0.55,

                          fontSize: 9.5,

                          color: "#9AA69F",
                        }}
                      >
                        {formatNotificationTime(
                          notification.createdAt
                        )}
                      </Typography>
                    </Box>
                  </MenuItem>
                );
              }
            )
        ) : (
          <Box
            sx={{
              py: 4,

              px: 2,

              textAlign: "center",
            }}
          >
            <Box
              sx={{
                width: 48,
                height: 48,

                mx: "auto",
                mb: 1.2,

                borderRadius: "50%",

                display: "flex",

                alignItems:
                  "center",

                justifyContent:
                  "center",

                background:
                  "#EDF8F1",

                color: "#168A52",
              }}
            >
              <DoneAllRoundedIcon
                sx={{
                  fontSize: 25,
                }}
              />
            </Box>

            <Typography
              sx={{
                fontSize: 13,

                fontWeight: 700,

                color: "#3A5045",
              }}
            >
              No notifications
            </Typography>

            <Typography
              sx={{
                fontSize: 10.5,

                color: "#87948D",

                mt: 0.4,
              }}
            >
              New updates will appear
              here.
            </Typography>
          </Box>
        )}

        {/* FOOTER */}

        <Divider />

        <Box
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();

            openNotificationsPage();
          }}
          sx={{
            py: 1.15,

            textAlign: "center",

            cursor: "pointer",

            background:
              "#FBFDFC",

            "&:hover": {
              background: "#F2F8F4",
            },
          }}
        >
          <Typography
            sx={{
              fontSize: 11,

              fontWeight: 700,

              color: "#168A52",
            }}
          >
            View all notifications
          </Typography>
        </Box>
      </Menu>

      {/* =====================================================
          PROFILE
      ===================================================== */}

      <Button
        onClick={(event) =>
          setProfileAnchor(
            event.currentTarget
          )
        }
        sx={{
          minWidth: 0,

          textTransform: "none",

          color: "#182033",

          px: {
            xs: 0.2,
            sm: 0.5,
          },

          borderRadius: 2.5,

          "&:hover": {
            background: "#F4F8F6",
          },
        }}
      >
        <Avatar
          sx={{
            width: {
              xs: 32,
              sm: 36,
            },

            height: {
              xs: 32,
              sm: 36,
            },

            mr: {
              xs: 0,
              sm: 0.8,
            },

            background:
              "linear-gradient(135deg,#129653,#08783E)",

            fontSize: 12,

            fontWeight: 800,
          }}
        >
          {getInitials(
            user?.name
          )}
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
          {user?.name ||
            "CarbonTrack User"}
        </Typography>

        <KeyboardArrowDownIcon
          sx={{
            display: {
              xs: "none",
              sm: "block",
            },

            ml: 0.3,

            fontSize: 18,
          }}
        />
      </Button>

      {/* =====================================================
          PROFILE MENU
      ===================================================== */}

      <Menu
        anchorEl={profileAnchor}
        open={Boolean(profileAnchor)}
        onClose={() => setProfileAnchor(null)}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        slotProps={{
          paper: {
            sx: {
              mt: 1,

              minWidth: {
                xs: 190,
                sm: 215,
              },

              borderRadius: 2.8,

              border:
                "1px solid #E3EBE6",

              background: "#FFFFFF",

              boxShadow:
                "0 18px 45px rgba(20,55,38,0.14)",

              overflow: "hidden",

              p: 0.7,

              "& .MuiMenuItem-root": {
                minHeight: 44,

                px: 1.2,
                py: 0.7,

                mx: 0.2,

                borderRadius: 1.9,

                fontSize: 13,

                fontWeight: 600,

                color: "#34483E",

                gap: 1,

                transition:
                  "background 150ms ease, color 150ms ease, transform 150ms ease",

                "&:hover": {
                  background: "#F1F8F4",

                  color: "#168A52",

                  transform:
                    "translateX(2px)",
                },
              },

              "& .MuiMenuItem-root:last-child": {
                mt: 0.25,

                color: "#C53B43",

                "&:hover": {
                  background: "#FFF3F3",

                  color: "#C62828",

                  transform:
                    "translateX(2px)",
                },
              },
            },
          },
        }}
      >
        {/* PROFILE */}

        <MenuItem
          onClick={() => {
            setProfileAnchor(null);
            navigate("/profile");
          }}
        >
          <Box
            sx={{
              width: 32,
              height: 32,

              borderRadius: 1.7,

              display: "flex",
              alignItems: "center",
              justifyContent: "center",

              background: "#EDF8F1",

              color: "#168A52",

              flexShrink: 0,
            }}
          >
            <Avatar
              sx={{
                width: 25,
                height: 25,

                background:
                  "linear-gradient(135deg,#129653,#08783E)",

                color: "#FFFFFF",

                fontSize: 9,

                fontWeight: 800,
              }}
            >
              {getInitials(user?.name)}
            </Avatar>
          </Box>

          <Box
            sx={{
              flex: 1,
              minWidth: 0,
            }}
          >
            <Typography
              sx={{
                fontSize: 12.5,

                fontWeight: 700,

                color: "inherit",

                lineHeight: 1.25,
              }}
            >
              Profile
            </Typography>

            <Typography
              sx={{
                mt: 0.15,

                fontSize: 9.5,

                color: "#89978F",

                lineHeight: 1.2,
              }}
            >
              View your profile
            </Typography>
          </Box>
        </MenuItem>

        {/* SETTINGS */}

        <MenuItem
          onClick={() => {
            setProfileAnchor(null);
            navigate("/settings");
          }}
        >
          <Box
            sx={{
              width: 32,
              height: 32,

              borderRadius: 1.7,

              display: "flex",
              alignItems: "center",
              justifyContent: "center",

              background: "#F2F6F4",

              color: "#587066",

              flexShrink: 0,

              transition:
                "all 150ms ease",
            }}
          >
            <TrackChangesOutlinedIcon
              sx={{
                fontSize: 18,
              }}
            />
          </Box>

          <Box
            sx={{
              flex: 1,
              minWidth: 0,
            }}
          >
            <Typography
              sx={{
                fontSize: 12.5,

                fontWeight: 700,

                color: "inherit",

                lineHeight: 1.25,
              }}
            >
              Settings
            </Typography>

            <Typography
              sx={{
                mt: 0.15,

                fontSize: 9.5,

                color: "#89978F",

                lineHeight: 1.2,
              }}
            >
              Manage your preferences
            </Typography>
          </Box>
        </MenuItem>

        {/* DIVIDER */}

        <Divider
          sx={{
            my: 0.65,

            borderColor: "#EEF2F0",
          }}
        />

        {/* LOGOUT */}

        <MenuItem
          onClick={handleLogout}
        >
          <Box
            sx={{
              width: 32,
              height: 32,

              borderRadius: 1.7,

              display: "flex",
              alignItems: "center",
              justifyContent: "center",

              background: "#FFF1F1",

              color: "#D14343",

              flexShrink: 0,
            }}
          >
            <LogoutOutlinedIcon
              sx={{
                fontSize: 18,
              }}
            />
          </Box>

          <Box
            sx={{
              flex: 1,
              minWidth: 0,
            }}
          >
            <Typography
              sx={{
                fontSize: 12.5,

                fontWeight: 700,

                color: "inherit",

                lineHeight: 1.25,
              }}
            >
              Logout
            </Typography>

            <Typography
              sx={{
                mt: 0.15,

                fontSize: 9.5,

                color: "#A18B8B",

                lineHeight: 1.2,
              }}
            >
              Sign out of CarbonTrack
            </Typography>
          </Box>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default DashboardTopbar;