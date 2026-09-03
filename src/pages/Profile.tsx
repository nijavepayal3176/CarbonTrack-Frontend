import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";

import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import WorkspacePremiumOutlinedIcon from "@mui/icons-material/WorkspacePremiumOutlined";
import Co2OutlinedIcon from "@mui/icons-material/Co2Outlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import PhotoCameraOutlinedIcon from "@mui/icons-material/PhotoCameraOutlined";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";

import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

interface Activity {
  _id: string;
  category: string;
  activityType: string;
  quantity: number;
  unit: string;
  emissionFactor: number;
  co2Emission: number;
  date: string;
  createdAt?: string;
  updatedAt?: string;
}

const Profile = () => {
  const navigate = useNavigate();

  const { user, updateUser, isLoading } = useAuth();

  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");
  const [coverImage, setCoverImage] = useState("");

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const [activities, setActivities] = useState<Activity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [activitiesError, setActivitiesError] = useState("");

  const [avatarError, setAvatarError] = useState(false);
  const [coverError, setCoverError] = useState(false);

  /*
   * Keep local form state synchronized with
   * the authenticated user returned by backend.
   */
  useEffect(() => {
    if (!user) {
      return;
    }

    setName(user.name || "");
    setAvatar(user.avatar || "");
    setCoverImage(user.coverImage || "");

    setAvatarError(false);
    setCoverError(false);
  }, [user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    let mounted = true;

    const fetchActivities = async () => {
      try {
        setActivitiesLoading(true);
        setActivitiesError("");

        const response = await api.get("/activities");
        const data = response.data?.data?.activities;

        if (mounted) {
          setActivities(Array.isArray(data) ? data : []);
        }
      } catch (err: any) {
        if (mounted) {
          setActivities([]);
          setActivitiesError(
            err?.response?.data?.message ||
              "Unable to load sustainability data."
          );
        }
      } finally {
        if (mounted) {
          setActivitiesLoading(false);
        }
      }
    };

    fetchActivities();

    return () => {
      mounted = false;
    };
  }, [user]);

  const totalCO2 = useMemo(() => {
    return activities.reduce(
      (total, activity) =>
        total + Number(activity.co2Emission || 0),
      0
    );
  }, [activities]);

  const currentMonthActivities = useMemo(() => {
    const now = new Date();

    return activities.filter((activity) => {
      const date = new Date(activity.date);

      return (
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
      );
    });
  }, [activities]);

  const currentMonthCO2 = useMemo(() => {
    return currentMonthActivities.reduce(
      (total, activity) =>
        total + Number(activity.co2Emission || 0),
      0
    );
  }, [currentMonthActivities]);

  const sustainabilityScore = useMemo(() => {
    if (activitiesLoading || activities.length === 0) {
      return 0;
    }

    const MONTHLY_TARGET_KG = 100;

    const emissionScore = Math.max(
      0,
      Math.min(
        100,
        100 -
          (currentMonthCO2 / MONTHLY_TARGET_KG) * 100
      )
    );

    const trackingScore = Math.min(
      100,
      currentMonthActivities.length * 10
    );

    const score =
      emissionScore * 0.75 +
      trackingScore * 0.25;

    return Math.round(
      Math.max(0, Math.min(100, score))
    );
  }, [
    activities,
    activitiesLoading,
    currentMonthActivities,
    currentMonthCO2,
  ]);

  const sustainabilityLabel = useMemo(() => {
    if (sustainabilityScore >= 85) {
      return "Excellent";
    }

    if (sustainabilityScore >= 70) {
      return "Very Good";
    }

    if (sustainabilityScore >= 50) {
      return "Good";
    }

    if (sustainabilityScore >= 30) {
      return "Needs Work";
    }

    return "Getting Started";
  }, [sustainabilityScore]);

  // const getScoreColor = (score: number) => {
  //   if (score >= 85) return "#16804F";
  //   if (score >= 70) return "#2E9B68";
  //   if (score >= 50) return "#D28A19";
  //   if (score >= 30) return "#E87524";
  //   return "#7B8794";
  // };

  const getInitials = (value: string): string => {
    const trimmed = value.trim();

    if (!trimmed) {
      return "U";
    }

    return trimmed
      .split(/\s+/)
      .map((part) => part.charAt(0))
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const formattedMemberSince = useMemo(() => {
    if (!user?.createdAt) {
      return "—";
    }

    const date = new Date(user.createdAt);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleDateString(undefined, {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }, [user?.createdAt]);

  const formattedUpdatedAt = useMemo(() => {
    if (!user?.updatedAt) {
      return null;
    }

    const date = new Date(user.updatedAt);

    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return date.toLocaleDateString(undefined, {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }, [user?.updatedAt]);

  const roleLabel = useMemo(() => {
    if (!user?.role) {
      return "User";
    }

    return (
      user.role.charAt(0).toUpperCase() +
      user.role.slice(1)
    );
  }, [user?.role]);

  const handleStartEditing = () => {
    if (!user) {
      return;
    }

    setName(user.name || "");
    setAvatar(user.avatar || "");
    setCoverImage(user.coverImage || "");

    setSuccess("");
    setError("");

    setAvatarError(false);
    setCoverError(false);

    setEditing(true);
  };

  const handleCancel = () => {
    if (!user) {
      return;
    }

    setName(user.name || "");
    setAvatar(user.avatar || "");
    setCoverImage(user.coverImage || "");

    setSuccess("");
    setError("");

    setAvatarError(false);
    setCoverError(false);

    setEditing(false);
  };

  const validateUrl = (
    value: string,
    fieldName: string
  ): string | null => {
    if (!value.trim()) {
      return null;
    }

    try {
      const url = new URL(value.trim());

      if (
        url.protocol !== "http:" &&
        url.protocol !== "https:"
      ) {
        return `Please enter a valid ${fieldName} URL.`;
      }
    } catch {
      return `Please enter a valid ${fieldName} URL.`;
    }

    return null;
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setSuccess("");
    setError("");

    const trimmedName = name.trim();
    const trimmedAvatar = avatar.trim();
    const trimmedCoverImage = coverImage.trim();

    if (trimmedName.length < 2) {
      setError(
        "Name must contain at least 2 characters."
      );
      return;
    }

    if (trimmedName.length > 80) {
      setError(
        "Name cannot exceed 80 characters."
      );
      return;
    }

    const avatarValidation = validateUrl(
      trimmedAvatar,
      "profile photo"
    );

    if (avatarValidation) {
      setError(avatarValidation);
      return;
    }

    const coverValidation = validateUrl(
      trimmedCoverImage,
      "background image"
    );

    if (coverValidation) {
      setError(coverValidation);
      return;
    }

    try {
      setSaving(true);

      await updateUser({
        name: trimmedName,
        avatar: trimmedAvatar,
        coverImage: trimmedCoverImage,
      });

      setSuccess(
        "Your profile has been updated successfully."
      );

      setEditing(false);

      setAvatarError(false);
      setCoverError(false);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Unable to update your profile. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#F6F9F7",
        }}
      >
        <CircularProgress
          size={32}
          sx={{
            color: "#149653",
          }}
        />
      </Box>
    );
  }

  if (!user) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: 2,
          background: "#F6F9F7",
        }}
      >
        <Card
          sx={{
            maxWidth: 460,
            width: "100%",
            borderRadius: 4,
            border: "1px solid #E4EAE6",
            boxShadow:
              "0 18px 50px rgba(16,45,30,0.08)",
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Typography
              sx={{
                fontSize: 22,
                fontWeight: 800,
                color: "#17251D",
              }}
            >
              Profile unavailable
            </Typography>

            <Typography
              sx={{
                mt: 1,
                color: "#68766E",
              }}
            >
              Please sign in again to view your profile.
            </Typography>

            <Button
              variant="contained"
              onClick={() => navigate("/login")}
              sx={{
                mt: 3,
                borderRadius: 2.2,
                textTransform: "none",
                fontWeight: 700,
                background: "#149653",
                "&:hover": {
                  background: "#087A40",
                },
              }}
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </Box>
    );
  }

  const displayAvatar =
    !avatarError && user.avatar
      ? user.avatar
      : undefined;

  const displayCover =
    !coverError && user.coverImage
      ? user.coverImage
      : undefined;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg,#F7FAF8 0%,#F3F8F5 100%)",
        px: {
          xs: 1.25,
          sm: 3,
          md: 5,
        },
        py: {
          xs: 2,
          sm: 3,
          md: 4,
        },
      }}
    >
      <Box
        sx={{
          maxWidth: 1080,
          mx: "auto",
        }}
      >
        {/* BACK */}
        <Button
          startIcon={<ArrowBackOutlinedIcon />}
          onClick={() => navigate("/dashboard")}
          sx={{
            textTransform: "none",
            color: "#53645A",
            fontWeight: 700,
            mb: 2.5,
            px: 0.5,
            "&:hover": {
              background: "transparent",
              color: "#149653",
            },
          }}
        >
          Back to Dashboard
        </Button>

        {/* PAGE HEADER */}
        <Box
          sx={{
            mb: 3,
          }}
        >
          <Typography
            sx={{
              fontSize: {
                xs: 27,
                sm: 32,
              },
              lineHeight: 1.15,
              fontWeight: 850,
              letterSpacing: "-0.8px",
              color: "#15221A",
            }}
          >
            Profile
          </Typography>

          <Typography
            sx={{
              mt: 0.7,
              color: "#69776F",
              fontSize: {
                xs: 13,
                sm: 14,
              },
            }}
          >
            Manage your personal information and
            CarbonTrack account details.
          </Typography>
        </Box>

        {/* MAIN PROFILE CARD */}
        <Card
          sx={{
            borderRadius: {
              xs: 3,
              sm: 4,
            },
            border: "1px solid #E1E9E4",
            boxShadow:
              "0 20px 55px rgba(17,50,32,0.08)",
            overflow: "hidden",
            background: "#FFFFFF",
          }}
        >
          {/* COVER / BACKGROUND */}
          <Box
            sx={{
              height: {
                xs: 155,
                sm: 205,
                md: 225,
              },
              position: "relative",
              overflow: "hidden",
              background: displayCover
                ? `linear-gradient(rgba(5,48,28,0.25),rgba(5,48,28,0.55)), url("${displayCover}") center/cover`
                : "linear-gradient(135deg,#075C34 0%,#0B7A42 45%,#20A860 100%)",
            }}
          >
            {/* Decorative shapes when no cover image */}
            {!displayCover && (
              <>
                <Box
                  sx={{
                    position: "absolute",
                    width: 280,
                    height: 280,
                    borderRadius: "50%",
                    right: {
                      xs: -150,
                      sm: -80,
                    },
                    top: -150,
                    background:
                      "rgba(255,255,255,0.08)",
                  }}
                />

                <Box
                  sx={{
                    position: "absolute",
                    width: 190,
                    height: 190,
                    borderRadius: "50%",
                    left: -100,
                    bottom: -140,
                    background:
                      "rgba(255,255,255,0.06)",
                  }}
                />
              </>
            )}

            {/* Cover content */}
            <Box
              sx={{
                position: "absolute",
                left: {
                  xs: 20,
                  sm: 36,
                  md: 42,
                },
                top: {
                  xs: 22,
                  sm: 32,
                },
              }}
            >
              <Typography
                sx={{
                  color:
                    "rgba(255,255,255,0.82)",
                  fontSize: 10.5,
                  fontWeight: 800,
                  letterSpacing: "1.4px",
                  textTransform: "uppercase",
                }}
              >
                CarbonTrack Account
              </Typography>

              <Typography
                sx={{
                  mt: 0.5,
                  color: "#FFFFFF",
                  fontSize: {
                    xs: 17,
                    sm: 22,
                  },
                  fontWeight: 850,
                  textShadow:
                    "0 2px 10px rgba(0,0,0,0.15)",
                }}
              >
                Your sustainability journey
              </Typography>
            </Box>

            {/* Cover image status */}
            {displayCover && (
              <Box
                sx={{
                  position: "absolute",
                  right: {
                    xs: 14,
                    sm: 24,
                  },
                  bottom: {
                    xs: 14,
                    sm: 20,
                  },
                  px: 1.3,
                  py: 0.7,
                  borderRadius: 99,
                  background:
                    "rgba(0,0,0,0.28)",
                  backdropFilter: "blur(10px)",
                  border:
                    "1px solid rgba(255,255,255,0.18)",
                }}
              >
                <Typography
                  sx={{
                    color: "#FFFFFF",
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  Personal cover
                </Typography>
              </Box>
            )}
          </Box>

          <CardContent
            sx={{
              px: {
                xs: 1.75,
                sm: 4,
                md: 5,
              },
              pb: {
                xs: 3,
                sm: 4.5,
              },
              pt: 0,
            }}
          >
            {/* PROFILE IDENTITY */}
            <Box
              sx={{
                display: "flex",
                alignItems: {
                  xs: "flex-start",
                  sm: "flex-end",
                },
                justifyContent: "space-between",
                gap: 2,
                flexDirection: {
                  xs: "column",
                  sm: "row",
                },
                mt: {
                  xs: -6.5,
                  sm: -7,
                },
                mb: 3.2,
              }}
            >
              <Box
                sx={{
                  position: "relative",
                }}
              >
                <Avatar
                  src={displayAvatar}
                  slotProps={{
                   img:{
                    onError: () =>
                      setAvatarError(true)},
                  }}
                  sx={{
                    width: {
                      xs: 104,
                      sm: 126,
                    },
                    height: {
                      xs: 104,
                      sm: 126,
                    },
                    border:
                      "6px solid #FFFFFF",
                    boxShadow:
                      "0 10px 30px rgba(14,54,32,0.18)",
                    background:
                      "linear-gradient(135deg,#149653,#087A40)",
                    fontSize: {
                      xs: 30,
                      sm: 38,
                    },
                    fontWeight: 850,
                    color: "#FFFFFF",
                  }}
                >
                  {getInitials(user.name)}
                </Avatar>

                <Box
                  sx={{
                    position: "absolute",
                    right: {
                      xs: 4,
                      sm: 5,
                    },
                    bottom: {
                      xs: 4,
                      sm: 5,
                    },
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#FFFFFF",
                    boxShadow:
                      "0 4px 12px rgba(0,0,0,0.12)",
                  }}
                >
                  <PhotoCameraOutlinedIcon
                    sx={{
                      fontSize: 16,
                      color: "#149653",
                    }}
                  />
                </Box>
              </Box>

              {!editing && (
                <Button
                  variant="outlined"
                  startIcon={
                    <EditOutlinedIcon />
                  }
                  onClick={handleStartEditing}
                  sx={{
                    textTransform: "none",
                    borderRadius: 2.2,
                    borderColor: "#D5E0D9",
                    color: "#26352C",
                    fontWeight: 750,
                    px: 2,
                    minHeight: 42,
                    "&:hover": {
                      borderColor: "#149653",
                      background: "#F2FAF5",
                      color: "#087A40",
                    },
                  }}
                >
                  Edit Profile
                </Button>
              )}
            </Box>

            {/* NAME + EMAIL */}
            <Box>
              <Typography
                sx={{
                  fontSize: {
                    xs: 25,
                    sm: 30,
                  },
                  lineHeight: 1.2,
                  fontWeight: 850,
                  letterSpacing: "-0.5px",
                  color: "#111C15",
                }}
              >
                {user.name}
              </Typography>

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.7,
                  mt: 0.8,
                }}
              >
                <EmailOutlinedIcon
                  sx={{
                    fontSize: 17,
                    color: "#738078",
                  }}
                />

                <Typography
                  sx={{
                    color: "#68766E",
                    fontSize: 14,
                    wordBreak: "break-word",
                  }}
                >
                  {user.email}
                </Typography>
              </Box>
            </Box>

            {/* REAL USER STATS */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(3, 1fr)",
                },
                gap: 1.5,
                mt: 3.2,
              }}
            >
              <ProfileStat
                icon={
                  <WorkspacePremiumOutlinedIcon />
                }
                label="Account Role"
                value={roleLabel}
              />

              <ProfileStat
                icon={
                  <EmojiEventsOutlinedIcon />
                }
                label="Sustainability Score"
                value={
                  activitiesLoading
                    ? "..."
                    : `${sustainabilityScore}`
                }
                accent
              />

              <ProfileStat
                icon={<Co2OutlinedIcon />}
                label="Total CO₂"
                value={
                  activitiesLoading
                    ? "..."
                    : `${totalCO2.toFixed(2)} kg`
                }
                accent
              />
            </Box>

            <Box
              sx={{
                mt: 1.5,
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: 1,
              }}
            >
              <Box
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 0.7,
                  px: 1.2,
                  py: 0.65,
                  borderRadius: 99,
                  background: "#F1F8F4",
                  border: "1px solid #DCEDE3",
                }}
              >
                <Box
                  sx={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: activitiesLoading
                      ? "#A4AFAB"
                      : "#149653",
                  }}
                />

                <Typography
                  sx={{
                    fontSize: 11.5,
                    fontWeight: 700,
                    color: "#496158",
                  }}
                >
                  {activitiesLoading
                    ? "Updating sustainability data..."
                    : `Live activity data • ${sustainabilityLabel}`}
                </Typography>
              </Box>

              {!activitiesLoading && (
                <Typography
                  sx={{
                    fontSize: 11.5,
                    color: "#78877F",
                  }}
                >
                  {activities.length} logged{" "}
                  {activities.length === 1
                    ? "activity"
                    : "activities"}
                </Typography>
              )}
            </Box>

            <Divider sx={{ my: 3.5 }} />

            {/* ALERTS */}
            {success && (
              <Alert
                severity="success"
                icon={
                  <CheckCircleOutlinedIcon />
                }
                onClose={() =>
                  setSuccess("")
                }
                sx={{
                  mb: 2.2,
                  borderRadius: 2.2,
                  border:
                    "1px solid #CBE8D6",
                  background: "#F2FBF5",
                  color: "#176A3B",
                  "& .MuiAlert-icon": {
                    color: "#149653",
                  },
                }}
              >
                {success}
              </Alert>
            )}

            {error && (
              <Alert
                severity="error"
                onClose={() =>
                  setError("")
                }
                sx={{
                  mb: 2.2,
                  borderRadius: 2.2,
                }}
              >
                {error}
              </Alert>
            )}

            {activitiesError && (
              <Alert
                severity="warning"
                sx={{
                  mb: 2.2,
                  borderRadius: 2.2,
                }}
              >
                {activitiesError}
              </Alert>
            )}

            {/* EDIT FORM */}
            {editing ? (
              <Box
                component="form"
                onSubmit={handleSubmit}
              >
                <Box sx={{ mb: 2.5 }}>
                  <Typography
                    sx={{
                      fontSize: 19,
                      fontWeight: 800,
                      color: "#17231B",
                    }}
                  >
                    Personalize your profile
                  </Typography>

                  <Typography
                    sx={{
                      mt: 0.45,
                      fontSize: 13,
                      color: "#748078",
                    }}
                  >
                    Update your name, profile photo and
                    cover background.
                  </Typography>
                </Box>

                <Stack spacing={2.2}>
                  {/* NAME */}
                  <TextField
                    label="Full Name"
                    value={name}
                    onChange={(event) =>
                      setName(event.target.value)
                    }
                    fullWidth
                    autoComplete="name"
                    disabled={saving}
slotProps={{
  input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonOutlineOutlinedIcon
                            sx={{
                              color: "#718078",
                            }}
                          />
                        </InputAdornment>
                      ),
                    
                    }}
                  }
                    helperText={`${name.trim().length}/80 characters`}
                    sx={fieldStyles}
                  />

                  {/* PROFILE PHOTO */}
                  <TextField
                    label="Profile Photo URL"
                    value={avatar}
                    onChange={(event) => {
                      setAvatar(event.target.value);
                      setAvatarError(false);
                    }}
                    fullWidth
                    disabled={saving}
                    autoComplete="url"
                    placeholder="https://example.com/profile.jpg"
slotProps={{
  input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <PhotoCameraOutlinedIcon
                            sx={{
                              color: "#718078",
                            }}
                          />
                        </InputAdornment>
                      ),
                    }}
                  }
                    helperText="Optional. Use a publicly accessible image URL."
                    sx={fieldStyles}
                  />

                  {/* COVER IMAGE */}
                  <TextField
                    label="Profile Background URL"
                    value={coverImage}
                    onChange={(event) => {
                      setCoverImage(
                        event.target.value
                      );
                      setCoverError(false);
                    }}
                    fullWidth
                    disabled={saving}
                    autoComplete="url"
                    placeholder="https://example.com/cover.jpg"
slotProps={{
  input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <ImageOutlinedIcon
                            sx={{
                              color: "#718078",
                            }}
                          />
                        </InputAdornment>
                      ),
                    }}}
                    helperText="Optional. This image will appear as your profile cover."
                    sx={fieldStyles}
                  />

                  {/* PREVIEWS */}
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: {
                        xs: "1fr",
                        sm: "1fr 1.7fr",
                      },
                      gap: 1.5,
                    }}
                  >
                    {/* AVATAR PREVIEW */}
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2.7,
                        border:
                          "1px solid #E3EAE5",
                        background: "#F8FBF9",
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: 11,
                          fontWeight: 800,
                          color: "#748078",
                          textTransform:
                            "uppercase",
                          letterSpacing: 0.8,
                          mb: 1.3,
                        }}
                      >
                        Profile Photo
                      </Typography>

                      <Avatar
                        src={
                          avatar.trim() ||
                          undefined
                        }
slotProps={{
  img: {
                          onError: () =>
                            setAvatarError(
                              true
                            ),
                        }}
                      }
                        sx={{
                          width: 68,
                          height: 68,
                          background:
                            "linear-gradient(135deg,#149653,#087A40)",
                          color: "#FFFFFF",
                          fontWeight: 800,
                          fontSize: 22,
                        }}
                      >
                        {getInitials(name)}
                      </Avatar>
                    </Box>

                    {/* COVER PREVIEW */}
                    <Box
                      sx={{
                        minHeight: 125,
                        borderRadius: 2.7,
                        overflow: "hidden",
                        position: "relative",
                        border:
                          "1px solid #E3EAE5",
                        background:
                          coverImage.trim() &&
                          !coverError
                            ? `url("${coverImage.trim()}") center/cover`
                            : "linear-gradient(135deg,#075C34,#149653,#23AA62)",
                      }}
                    >
                      {coverImage.trim() && (
                        <Box
                          sx={{
                            position:
                              "absolute",
                            inset: 0,
                            background:
                              "rgba(4,38,22,0.25)",
                          }}
                        />
                      )}

                      <Box
                        sx={{
                          position:
                            "absolute",
                          left: 16,
                          bottom: 14,
                        }}
                      >
                        <Typography
                          sx={{
                            color: "#FFFFFF",
                            fontSize: 11,
                            fontWeight: 800,
                            textTransform:
                              "uppercase",
                            letterSpacing: 0.8,
                          }}
                        >
                          Background Preview
                        </Typography>

                        <Typography
                          sx={{
                            mt: 0.3,
                            color:
                              "rgba(255,255,255,0.9)",
                            fontSize: 12,
                            fontWeight: 600,
                          }}
                        >
                          Your CarbonTrack profile
                        </Typography>
                      </Box>

                      {coverImage.trim() && (
                        <Box
                          component="img"
                          src={coverImage.trim()}
                          alt="Cover preview"
                          onError={() =>
                            setCoverError(
                              true
                            )
                          }
                          sx={{
                            display: "none",
                          }}
                        />
                      )}
                    </Box>
                  </Box>

                  {/* EMAIL */}
                  <TextField
                    label="Email Address"
                    value={user.email}
                    disabled
                    fullWidth
slotProps={{
  input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailOutlinedIcon
                            sx={{
                              color: "#718078",
                            }}
                          />
                        </InputAdornment>
                      ),
                    }}
                  }
                    helperText="Your email address cannot be changed from this page."
                    sx={fieldStyles}
                  />

                  {/* ACTIONS */}
                  <Stack
                    direction={{
                      xs: "column",
                      sm: "row",
                    }}
                    spacing={1.5}
                    sx={{
                      pt: 0.5,
                    }}
                  >
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={saving}
                      startIcon={
                        saving ? (
                          <CircularProgress
                            size={18}
                            sx={{
                              color: "#FFFFFF",
                            }}
                          />
                        ) : (
                          <CheckCircleOutlinedIcon />
                        )
                      }
                      sx={{
                        minHeight: 44,
                        px: 2.5,
                        borderRadius: 2.2,
                        textTransform: "none",
                        fontWeight: 750,
                        background: "#149653",
                        boxShadow:
                          "0 7px 18px rgba(20,150,83,0.18)",
                        "&:hover": {
                          background: "#087A40",
                        },
                      }}
                    >
                      {saving
                        ? "Saving..."
                        : "Save Changes"}
                    </Button>

                    <Button
                      type="button"
                      disabled={saving}
                      startIcon={
                        <CloseOutlinedIcon />
                      }
                      onClick={handleCancel}
                      sx={{
                        minHeight: 44,
                        px: 2.3,
                        borderRadius: 2.2,
                        textTransform: "none",
                        fontWeight: 700,
                        color: "#59675F",
                        "&:hover": {
                          background: "#F3F6F4",
                        },
                      }}
                    >
                      Cancel
                    </Button>
                  </Stack>
                </Stack>
              </Box>
            ) : (
              <>
                {/* ACCOUNT INFORMATION */}
                <Box sx={{ mb: 2 }}>
                  <Typography
                    sx={{
                      fontSize: 18,
                      fontWeight: 800,
                      color: "#17231B",
                    }}
                  >
                    Account information
                  </Typography>

                  <Typography
                    sx={{
                      mt: 0.45,
                      fontSize: 13,
                      color: "#748078",
                    }}
                  >
                    Information associated with your
                    CarbonTrack account.
                  </Typography>
                </Box>

                <Stack spacing={1.2}>
                  <InfoRow
                    icon={
                      <EmailOutlinedIcon />
                    }
                    label="Email Address"
                    value={user.email}
                  />

                  <InfoRow
                    icon={
                      <CalendarMonthOutlinedIcon />
                    }
                    label="Member Since"
                    value={formattedMemberSince}
                  />

                  {formattedUpdatedAt && (
                    <InfoRow
                      icon={
                        <EditOutlinedIcon />
                      }
                      label="Profile Last Updated"
                      value={
                        formattedUpdatedAt
                      }
                    />
                  )}

                  <InfoRow
                    icon={
                      <Co2OutlinedIcon />
                    }
                    label="This Month CO₂"
                    value={
                      activitiesLoading
                        ? "Updating..."
                        : `${currentMonthCO2.toFixed(2)} kg`
                    }
                  />

                  <InfoRow
                    icon={
                      <WorkspacePremiumOutlinedIcon />
                    }
                    label="Account Role"
                    value={roleLabel}
                  />
                </Stack>
              </>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

const fieldStyles = {
  "& .MuiOutlinedInput-root": {
    borderRadius: 2.2,
    background: "#FFFFFF",

    "& fieldset": {
      borderColor: "#DCE5DF",
    },

    "&:hover fieldset": {
      borderColor: "#AFC8BA",
    },

    "&.Mui-focused fieldset": {
      borderColor: "#149653",
      borderWidth: 1.5,
    },
  },

  "& .MuiInputLabel-root.Mui-focused": {
    color: "#149653",
  },

  "& .MuiFormHelperText-root": {
    ml: 0.3,
    color: "#7A867F",
  },
};

const ProfileStat = ({
  icon,
  label,
  value,
  accent = false,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  accent?: boolean;
}) => {
  return (
    <Box
      sx={{
        p: {
          xs: 2,
          sm: 2.2,
        },
        minHeight: 112,
        borderRadius: 2.7,
        border: "1px solid #E4EBE6",
        background: accent
          ? "linear-gradient(145deg,#F8FCF9 0%,#EDF8F1 100%)"
          : "linear-gradient(145deg,#FBFDFC 0%,#F5F9F6 100%)",
        transition:
          "transform .2s ease, box-shadow .2s ease, border-color .2s ease",

        "&:hover": {
          transform: "translateY(-2px)",
          borderColor: "#D1E1D7",
          boxShadow:
            "0 8px 22px rgba(22,72,44,0.07)",
        },
      }}
    >
      <Box
        sx={{
          width: 37,
          height: 37,
          borderRadius: 1.8,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#149653",
          background: "#EAF7EF",
          mb: 1.25,
        }}
      >
        {icon}
      </Box>

      <Typography
        sx={{
          fontSize: 11.5,
          color: "#718078",
          fontWeight: 650,
        }}
      >
        {label}
      </Typography>

      <Typography
        sx={{
          mt: 0.35,
          fontSize: {
            xs: 17,
            sm: 18,
          },
          fontWeight: 850,
          color: "#17231B",
        }}
      >
        {value}
      </Typography>
    </Box>
  );
};

const InfoRow = ({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) => {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        p: {
          xs: 1.5,
          sm: 1.8,
        },
        borderRadius: 2.3,
        border: "1px solid #E8EEE9",
        background: "#FAFCFB",
      }}
    >
      <Box
        sx={{
          flexShrink: 0,
          width: 38,
          height: 38,
          borderRadius: 1.8,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#149653",
          background: "#EAF7EF",
        }}
      >
        {icon}
      </Box>

      <Box sx={{ minWidth: 0 }}>
        <Typography
          sx={{
            fontSize: 11,
            color: "#758078",
            fontWeight: 600,
          }}
        >
          {label}
        </Typography>

        <Typography
          sx={{
            mt: 0.2,
            fontSize: 14,
            fontWeight: 700,
            color: "#26332B",
            wordBreak: "break-word",
          }}
        >
          {value}
        </Typography>
      </Box>
    </Box>
  );
};

export default Profile;