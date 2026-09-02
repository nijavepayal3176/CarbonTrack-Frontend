
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";

import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import DoneAllRoundedIcon from "@mui/icons-material/DoneAllRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import AddTaskRoundedIcon from "@mui/icons-material/AddTaskRounded";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

import { useNavigate } from "react-router-dom";

import type {
  CarbonNotification,
} from "../utils/notifications";

import {
  getNotifications,
  deleteNotification,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  NOTIFICATIONS_UPDATE_EVENT,
} from "../utils/notifications";

const Notifications = () => {
  const navigate = useNavigate();

  const [notifications, setNotifications] =
    useState<CarbonNotification[]>([]);

  const loadNotifications =
    useCallback(() => {
      const data = getNotifications();

      setNotifications(
        Array.isArray(data)
          ? data
          : []
      );
    }, []);

  useEffect(() => {
    loadNotifications();

    const handleUpdate = () => {
      loadNotifications();
    };

    window.addEventListener(
      NOTIFICATIONS_UPDATE_EVENT,
      handleUpdate
    );

    window.addEventListener(
      "storage",
      handleUpdate
    );

    return () => {
      window.removeEventListener(
        NOTIFICATIONS_UPDATE_EVENT,
        handleUpdate
      );

      window.removeEventListener(
        "storage",
        handleUpdate
      );
    };
  }, [loadNotifications]);

  const unreadCount = useMemo(
    () =>
      notifications.filter(
        (notification) =>
          !notification.read
      ).length,
    [notifications]
  );

  const formatTime = (
    dateString: string
  ) => {
    const date = new Date(dateString);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "";
    }

    const diff =
      Math.max(
        0,
        Date.now() -
          date.getTime()
      );

    const minutes = Math.floor(
      diff / 60000
    );

    if (minutes < 1) {
      return "Just now";
    }

    if (minutes < 60) {
      return `${minutes} min ago`;
    }

    const hours = Math.floor(
      minutes / 60
    );

    if (hours < 24) {
      return `${hours} hr${
        hours > 1 ? "s" : ""
      } ago`;
    }

    const days = Math.floor(
      hours / 24
    );

    if (days < 7) {
      return `${days} day${
        days > 1 ? "s" : ""
      } ago`;
    }

    return date.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  const getIcon = (
    type: CarbonNotification["type"]
  ) => {
    if (type === "activity") {
      return (
        <AddTaskRoundedIcon
          sx={{
            fontSize: 22,
            color: "#168A52",
          }}
        />
      );
    }

    if (type === "goal") {
      return (
        <EmojiEventsOutlinedIcon
          sx={{
            fontSize: 22,
            color: "#168A52",
          }}
        />
      );
    }

    return (
      <InfoOutlinedIcon
        sx={{
          fontSize: 22,
          color: "#168A52",
        }}
      />
    );
  };

  const handleMarkRead = (
    notification: CarbonNotification
  ) => {
    if (!notification.read) {
      markNotificationAsRead(
        notification.id
      );
    }

    loadNotifications();
  };

  const handleDelete = (
    event: React.MouseEvent,
    id: string
  ) => {
    event.stopPropagation();

    deleteNotification(id);
    loadNotifications();
  };

  const handleMarkAllRead = () => {
    markAllNotificationsAsRead();
    loadNotifications();
  };

  return (
    <Box
      sx={{
        minHeight: "100%",
        background: "#F6F9F7",
        p: {
          xs: 1.5,
          sm: 2,
          md: 3,
          lg: 4,
        },
      }}
    >
      <Box
        sx={{
          maxWidth: 1000,
          mx: "auto",
        }}
      >
        {/* HEADER */}

        <Box
          sx={{
            display: "flex",
            alignItems: {
              xs: "flex-start",
              sm: "center",
            },
            justifyContent:
              "space-between",
            gap: 2,
            mb: 3,
            flexDirection: {
              xs: "column",
              sm: "row",
            },
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.2,
            }}
          >
            <IconButton
              onClick={() =>
                navigate("/dashboard")
              }
              aria-label="Back to dashboard"
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                background: "#FFFFFF",
                border:
                  "1px solid #E3EAE6",
                color: "#42564B",
                "&:hover": {
                  background:
                    "#EEF7F1",
                  color: "#168A52",
                },
              }}
            >
              <ArrowBackRoundedIcon />
            </IconButton>

            <Box>
              <Typography
                sx={{
                  fontSize: {
                    xs: 22,
                    sm: 26,
                  },
                  fontWeight: 800,
                  color: "#17231D",
                  letterSpacing:
                    "-0.5px",
                }}
              >
                Notifications
              </Typography>

              <Typography
                sx={{
                  mt: 0.3,
                  fontSize: 13,
                  color: "#75867C",
                }}
              >
                Stay updated with your
                CarbonTrack activity.
              </Typography>
            </Box>
          </Box>

          {unreadCount > 0 && (
            <Button
              onClick={
                handleMarkAllRead
              }
              startIcon={
                <DoneAllRoundedIcon />
              }
              variant="outlined"
              sx={{
                textTransform: "none",
                borderRadius: 2,
                borderColor:
                  "#CFE2D6",
                color: "#168A52",
                fontWeight: 700,
                fontSize: 13,
                "&:hover": {
                  borderColor:
                    "#168A52",
                  background:
                    "#EDF8F1",
                },
              }}
            >
              Mark all as seen
            </Button>
          )}
        </Box>

        {/* UNREAD SUMMARY */}

        {unreadCount > 0 && (
          <Alert
            icon={
              <NotificationsNoneOutlinedIcon />
            }
            severity="success"
            sx={{
              mb: 2.5,
              borderRadius: 2.5,
              background: "#EDF8F1",
              color: "#23633F",
              border:
                "1px solid #D4EBDD",
              "& .MuiAlert-icon": {
                color: "#168A52",
              },
            }}
          >
            You have{" "}
            <strong>
              {unreadCount}
            </strong>{" "}
            new notification
            {unreadCount !== 1
              ? "s"
              : ""}
            .
          </Alert>
        )}

        {/* EMPTY */}

        {notifications.length === 0 ? (
          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              border:
                "1px solid #E2EAE5",
              background: "#FFFFFF",
            }}
          >
            <CardContent
              sx={{
                py: 7,
                textAlign: "center",
              }}
            >
              <Box
                sx={{
                  width: 68,
                  height: 68,
                  mx: "auto",
                  mb: 2,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent:
                    "center",
                  background: "#EDF8F1",
                  color: "#168A52",
                }}
              >
                <NotificationsNoneOutlinedIcon
                  sx={{
                    fontSize: 32,
                  }}
                />
              </Box>

              <Typography
                sx={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: "#24372D",
                }}
              >
                No notifications yet
              </Typography>

              <Typography
                sx={{
                  mt: 0.7,
                  fontSize: 13,
                  color: "#819087",
                }}
              >
                Your CarbonTrack
                updates will appear here.
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Stack spacing={1.3}>
            {notifications.map(
              (notification) => (
                <Card
                  key={notification.id}
                  elevation={0}
                  onClick={() =>
                    handleMarkRead(
                      notification
                    )
                  }
                  sx={{
                    borderRadius: 2.7,
                    border:
                      notification.read
                        ? "1px solid #E3EAE6"
                        : "1px solid #CFE6D8",
                    background:
                      notification.read
                        ? "#FFFFFF"
                        : "#FBFEFC",
                    cursor: "pointer",
                    transition:
                      "all 160ms ease",
                    "&:hover": {
                      transform:
                        "translateY(-1px)",
                      boxShadow:
                        "0 8px 25px rgba(25,75,48,0.07)",
                    },
                  }}
                >
                  <CardContent
                    sx={{
                      p: {
                        xs: 1.6,
                        sm: 2,
                      },
                      "&:last-child": {
                        pb: {
                          xs: 1.6,
                          sm: 2,
                        },
                      },
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems:
                          "flex-start",
                        gap: 1.5,
                      }}
                    >
                      <Box
                        sx={{
                          width: 42,
                          height: 42,
                          borderRadius: 2,
                          flexShrink: 0,
                          display: "flex",
                          alignItems:
                            "center",
                          justifyContent:
                            "center",
                          background:
                            notification.read
                              ? "#F1F5F3"
                              : "#EAF7EF",
                        }}
                      >
                        {getIcon(
                          notification.type
                        )}
                      </Box>

                      <Box
                        sx={{
                          flex: 1,
                          minWidth: 0,
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems:
                              "center",
                            gap: 0.8,
                            flexWrap:
                              "wrap",
                          }}
                        >
                          <Typography
                            sx={{
                              fontSize: 14,
                              fontWeight: 800,
                              color:
                                "#263B30",
                            }}
                          >
                            {
                              notification.title
                            }
                          </Typography>

                          {!notification.read && (
                            <Chip
                              label="NEW"
                              size="small"
                              sx={{
                                height: 19,
                                fontSize: 9,
                                fontWeight: 800,
                                color:
                                  "#168A52",
                                background:
                                  "#E7F6EC",
                                borderRadius:
                                  1.2,
                              }}
                            />
                          )}
                        </Box>

                        <Typography
                          sx={{
                            mt: 0.45,
                            fontSize: 13,
                            lineHeight: 1.55,
                            color:
                              "#64766C",
                          }}
                        >
                          {
                            notification.message
                          }
                        </Typography>

                        <Typography
                          sx={{
                            mt: 0.8,
                            fontSize: 11,
                            color:
                              "#98A59E",
                          }}
                        >
                          {formatTime(
                            notification.createdAt
                          )}
                        </Typography>
                      </Box>

                      <IconButton
                        onClick={(event) =>
                          handleDelete(
                            event,
                            notification.id
                          )
                        }
                        aria-label="Delete notification"
                        sx={{
                          width: 34,
                          height: 34,
                          color: "#9AA69F",
                          borderRadius: 1.7,
                          flexShrink: 0,
                          "&:hover": {
                            color: "#D64545",
                            background:
                              "#FFF2F2",
                          },
                        }}
                      >
                        <DeleteOutlineRoundedIcon
                          sx={{
                            fontSize: 19,
                          }}
                        />
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
              )
            )}
          </Stack>
        )}

        {notifications.length > 0 && (
          <Box
            sx={{
              mt: 2,
              textAlign: "center",
            }}
          >
            <Divider
              sx={{
                mb: 1.5,
                borderColor: "#E8EEEA",
              }}
            />

            <Typography
              sx={{
                fontSize: 11,
                color: "#98A59E",
              }}
            >
              Click a notification to
              mark it as seen.
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default Notifications;
