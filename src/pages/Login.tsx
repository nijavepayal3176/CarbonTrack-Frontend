import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import NatureOutlinedIcon from "@mui/icons-material/NatureOutlined";
import CloudOutlinedIcon from "@mui/icons-material/CloudOutlined";
import TrendingDownOutlinedIcon from "@mui/icons-material/TrendingDownOutlined";
import TrackChangesOutlinedIcon from "@mui/icons-material/TrackChangesOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";

import { GoogleLogin } from "@react-oauth/google";

import { useAuth } from "../context/AuthContext";

const Login = () => {
  const navigate = useNavigate();

  const { login, googleLogin } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // =========================================================
  // EMAIL / PASSWORD LOGIN
  // =========================================================

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);

    try {
      await login(email.trim(), password);

      navigate("/dashboard", {
        replace: true,
      });
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Invalid email or password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // GOOGLE LOGIN
  // =========================================================

  const handleGoogleSuccess = async (response: {
    credential?: string;
  }) => {
    setError("");
    setGoogleLoading(true);

    try {
      const credential = response?.credential;

      if (!credential) {
        throw new Error(
          "Google authentication credential was not received."
        );
      }

      await googleLogin(credential);

      navigate("/dashboard", {
        replace: true,
      });
    } catch (err: any) {
      console.error("Google login error:", err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Google login failed. Please try again."
      );
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleError = () => {
    setGoogleLoading(false);

    setError(
      "Google sign-in was cancelled or could not be completed. Please try again."
    );
  };

  // =========================================================
  // INPUT STYLE
  // =========================================================

  const fieldStyle = {
    "& .MuiOutlinedInput-root": {
      minHeight: 54,
      borderRadius: "14px",
      backgroundColor: "#F9FBFA",
      fontSize: "0.93rem",
      transition: "all 0.2s ease",

      "& fieldset": {
        borderColor: "#DFE8E2",
        transition: "all 0.2s ease",
      },

      "&:hover": {
        backgroundColor: "#FFFFFF",

        "& fieldset": {
          borderColor: "#A8CBB7",
        },
      },

      "&.Mui-focused": {
        backgroundColor: "#FFFFFF",

        "& fieldset": {
          borderColor: "#16804F",
          borderWidth: 1.5,
        },
      },
    },

    "& .MuiInputBase-input": {
      padding: "15px 16px",
    },

    "& .MuiInputBase-input::placeholder": {
      color: "#9BA8A1",
      opacity: 1,
    },
  };

  return (
    <Box
      sx={{
        // =====================================================
        // RESPONSIVE PAGE CONTAINER
        // =====================================================

        minHeight: "100dvh",
        width: "100%",

        position: "relative",

        overflowX: "hidden",
        overflowY: "auto",

        display: "flex",

        alignItems: {
          xs: "flex-start",
          md: "center",
        },

        justifyContent: "center",

        px: {
          xs: 1,
          sm: 2,
          md: 3,
          lg: 4,
        },

        py: {
          xs: 1.5,
          sm: 2,
          md: 3,
          lg: 3,
        },

        boxSizing: "border-box",

        background:
          "radial-gradient(circle at 0% 0%, rgba(22,128,79,0.13), transparent 30%), radial-gradient(circle at 100% 100%, rgba(22,128,79,0.10), transparent 30%), linear-gradient(135deg, #F7FAF8 0%, #F1F7F3 50%, #ECF5EF 100%)",
      }}
    >
      {/* =====================================================
          BACKGROUND DECORATION
      ===================================================== */}

      <Box
        sx={{
          position: "absolute",

          width: {
            xs: 280,
            sm: 380,
            md: 480,
          },

          height: {
            xs: 280,
            sm: 380,
            md: 480,
          },

          borderRadius: "50%",

          border: "1px solid rgba(22,128,79,0.08)",

          top: {
            xs: -170,
            sm: -220,
            md: -270,
          },

          left: {
            xs: -150,
            sm: -180,
            md: -220,
          },

          pointerEvents: "none",
        }}
      />

      <Box
        sx={{
          position: "absolute",

          width: {
            xs: 360,
            sm: 500,
            md: 650,
          },

          height: {
            xs: 360,
            sm: 500,
            md: 650,
          },

          borderRadius: "50%",

          border: "1px solid rgba(22,128,79,0.07)",

          bottom: {
            xs: -230,
            sm: -300,
            md: -390,
          },

          right: {
            xs: -190,
            sm: -240,
            md: -300,
          },

          pointerEvents: "none",
        }}
      />

      <Box
        sx={{
          position: "absolute",

          width: {
            xs: 8,
            sm: 10,
            md: 12,
          },

          height: {
            xs: 8,
            sm: 10,
            md: 12,
          },

          borderRadius: "50%",

          backgroundColor: "#16804F",

          opacity: 0.18,

          top: {
            xs: "12%",
            sm: "15%",
            md: "18%",
          },

          left: {
            xs: "5%",
            sm: "7%",
            md: "8%",
          },

          pointerEvents: "none",
        }}
      />

      <Box
        sx={{
          position: "absolute",

          width: {
            xs: 6,
            sm: 7,
            md: 8,
          },

          height: {
            xs: 6,
            sm: 7,
            md: 8,
          },

          borderRadius: "50%",

          backgroundColor: "#16804F",

          opacity: 0.15,

          bottom: {
            xs: "12%",
            sm: "16%",
            md: "20%",
          },

          right: {
            xs: "7%",
            sm: "10%",
            md: "12%",
          },

          pointerEvents: "none",
        }}
      />

      {/* =====================================================
          MAIN CARD
      ===================================================== */}

      <Card
        elevation={0}
        sx={{
          width: "100%",

          maxWidth: {
            xs: "100%",
            sm: 600,
            md: 1000,
          },

          borderRadius: {
            xs: 2.5,
            sm: 3,
            md: 4,
          },

          overflow: "hidden",

          border: "1px solid rgba(22,128,79,0.10)",

          backgroundColor: "#FFFFFF",

          boxShadow:
            "0 24px 60px rgba(23,72,48,0.11)",

          position: "relative",

          zIndex: 1,

          flexShrink: 0,
        }}
      >
        <Box
          sx={{
            display: "grid",

            gridTemplateColumns: {
              xs: "1fr",
              md: "0.92fr 1.08fr",
            },

            width: "100%",
          }}
        >
          {/* =================================================
              LEFT BRAND / EXPERIENCE PANEL
          ================================================= */}

          <Box
            sx={{
              display: {
                xs: "none",
                md: "flex",
              },

              minHeight: {
                md: 560,
                lg: 600,
              },

              position: "relative",

              overflow: "hidden",

              flexDirection: "column",

              justifyContent: "space-between",

              p: {
                md: 4,
                lg: 4.5,
              },

              color: "#FFFFFF",

              background:
                "linear-gradient(145deg, #062E1E 0%, #0A4D31 35%, #0F6B40 68%, #16804F 100%)",
            }}
          >
            {/* Decorative rings */}

            <Box
              sx={{
                position: "absolute",

                width: {
                  md: 380,
                  lg: 430,
                },

                height: {
                  md: 380,
                  lg: 430,
                },

                borderRadius: "50%",

                border:
                  "1px solid rgba(255,255,255,0.10)",

                top: {
                  md: -180,
                  lg: -210,
                },

                right: {
                  md: -160,
                  lg: -180,
                },

                pointerEvents: "none",
              }}
            />

            <Box
              sx={{
                position: "absolute",

                width: {
                  md: 290,
                  lg: 330,
                },

                height: {
                  md: 290,
                  lg: 330,
                },

                borderRadius: "50%",

                border:
                  "1px solid rgba(255,255,255,0.07)",

                top: {
                  md: -140,
                  lg: -160,
                },

                right: {
                  md: -115,
                  lg: -130,
                },

                pointerEvents: "none",
              }}
            />

            <Box
              sx={{
                position: "absolute",

                width: {
                  md: 420,
                  lg: 480,
                },

                height: {
                  md: 420,
                  lg: 480,
                },

                borderRadius: "50%",

                border:
                  "1px solid rgba(255,255,255,0.07)",

                bottom: {
                  md: -260,
                  lg: -300,
                },

                left: {
                  md: -230,
                  lg: -270,
                },

                pointerEvents: "none",
              }}
            />

            <Box
              sx={{
                position: "absolute",

                width: {
                  md: 160,
                  lg: 190,
                },

                height: {
                  md: 160,
                  lg: 190,
                },

                borderRadius: "50%",

                background:
                  "rgba(255,255,255,0.035)",

                top: "42%",

                right: {
                  md: -40,
                  lg: -45,
                },

                pointerEvents: "none",
              }}
            />

            {/* =================================================
                BRAND
            ================================================= */}

            <Box
              sx={{
                position: "relative",
                zIndex: 2,
              }}
            >
              <Stack
                direction="row"
                spacing={1.5}
                sx={{
                  alignItems: "center",
                  mb: 5,
                }}
              >
                <Box
                  sx={{
                    width: 54,
                    height: 54,

                    minWidth: 54,

                    borderRadius: "16px",

                    display: "flex",

                    alignItems: "center",

                    justifyContent: "center",

                    background:
                      "linear-gradient(145deg, rgba(255,255,255,0.20), rgba(255,255,255,0.08))",

                    border:
                      "1px solid rgba(255,255,255,0.16)",

                    boxShadow:
                      "0 10px 30px rgba(0,0,0,0.12)",

                    backdropFilter: "blur(12px)",
                  }}
                >
                  <NatureOutlinedIcon
                    sx={{
                      fontSize: 31,
                      color: "#FFFFFF",
                    }}
                  />
                </Box>

                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    sx={{
                      fontSize: 23,
                      fontWeight: 900,
                      lineHeight: 1,
                      letterSpacing: "-0.7px",
                    }}
                  >
                    CarbonTrack
                  </Typography>

                  <Typography
                    sx={{
                      mt: 0.7,
                      fontSize: 9.5,
                      opacity: 0.65,
                      letterSpacing: 1.5,
                      textTransform: "uppercase",
                      fontWeight: 700,
                    }}
                  >
                    Sustainability Platform
                  </Typography>
                </Box>
              </Stack>

              {/* =================================================
                  HERO
              ================================================= */}

              <Typography
                sx={{
                  fontSize: {
                    md: 36,
                    lg: 43,
                  },

                  fontWeight: 900,

                  lineHeight: 1.1,

                  letterSpacing: "-1.7px",

                  maxWidth: 430,

                  mb: 2.2,
                }}
              >
                Measure today.
                <br />

                <Box
                  component="span"
                  sx={{
                    color: "#9CF2BD",
                  }}
                >
                  Change tomorrow.
                </Box>
              </Typography>

              <Typography
                sx={{
                  maxWidth: 420,

                  fontSize: 14.5,

                  lineHeight: 1.75,

                  color:
                    "rgba(255,255,255,0.72)",
                }}
              >
                Understand your carbon footprint,
                discover actionable insights and
                build a more sustainable lifestyle
                with measurable progress.
              </Typography>

              {/* =================================================
                  IMPACT BADGE
              ================================================= */}

              <Box
                sx={{
                  mt: 4,

                  display: "inline-flex",

                  alignItems: "center",

                  gap: 1.2,

                  px: 1.6,

                  py: 1,

                  borderRadius: "12px",

                  background:
                    "rgba(255,255,255,0.08)",

                  border:
                    "1px solid rgba(255,255,255,0.10)",

                  backdropFilter: "blur(8px)",

                  maxWidth: "100%",
                }}
              >
                <Box
                  sx={{
                    width: 8,
                    height: 8,

                    minWidth: 8,

                    borderRadius: "50%",

                    backgroundColor: "#8FF0B8",

                    boxShadow:
                      "0 0 0 5px rgba(143,240,184,0.10)",
                  }}
                />

                <Typography
                  sx={{
                    fontSize: 11,
                    fontWeight: 800,
                    color:
                      "rgba(255,255,255,0.86)",
                  }}
                >
                  Your journey toward a greener future
                </Typography>
              </Box>
            </Box>

            {/* =================================================
                FEATURES
            ================================================= */}

            <Stack
              spacing={1.5}
              sx={{
                position: "relative",
                zIndex: 2,
              }}
            >
              {[
                {
                  icon: <CloudOutlinedIcon />,
                  title: "Monitor emissions",
                  subtitle:
                    "Keep your carbon footprint visible.",
                },
                {
                  icon: <TrendingDownOutlinedIcon />,
                  title: "Reduce your impact",
                  subtitle:
                    "Turn data into meaningful action.",
                },
                {
                  icon: <TrackChangesOutlinedIcon />,
                  title: "Achieve your goals",
                  subtitle:
                    "Build measurable sustainable habits.",
                },
              ].map((feature) => (
                <Stack
                  key={feature.title}
                  direction="row"
                  spacing={1.5}
                  sx={{
                    alignItems: "center",
                  }}
                >
                  <Box
                    sx={{
                      width: 44,
                      height: 44,

                      minWidth: 44,

                      borderRadius: "13px",

                      display: "flex",

                      alignItems: "center",

                      justifyContent: "center",

                      color: "#FFFFFF",

                      background:
                        "rgba(255,255,255,0.09)",

                      border:
                        "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    {feature.icon}
                  </Box>

                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      sx={{
                        fontSize: 13,
                        fontWeight: 800,
                      }}
                    >
                      {feature.title}
                    </Typography>

                    <Typography
                      sx={{
                        mt: 0.25,
                        fontSize: 11,
                        color:
                          "rgba(255,255,255,0.55)",
                      }}
                    >
                      {feature.subtitle}
                    </Typography>
                  </Box>
                </Stack>
              ))}
            </Stack>
          </Box>

          {/* =================================================
              RIGHT LOGIN PANEL
          ================================================= */}

          <CardContent
            sx={{
              p: {
                xs: 2,
                sm: 3,
                md: 4,
                lg: 4.5,
              },

              display: "flex",

              flexDirection: "column",

              justifyContent: "center",

              boxSizing: "border-box",

              minWidth: 0,
            }}
          >
            <Box
              sx={{
                width: "100%",

                maxWidth: 440,

                mx: "auto",

                minWidth: 0,
              }}
            >
              {/* =================================================
                  MOBILE BRAND
              ================================================= */}

              <Stack
                direction="row"
                spacing={1.2}
                sx={{
                  alignItems: "center",

                  display: {
                    xs: "flex",
                    md: "none",
                  },

                  mb: {
                    xs: 3,
                    sm: 4,
                  },

                  minWidth: 0,
                }}
              >
                <Box
                  sx={{
                    width: {
                      xs: 42,
                      sm: 44,
                    },

                    height: {
                      xs: 42,
                      sm: 44,
                    },

                    minWidth: {
                      xs: 42,
                      sm: 44,
                    },

                    borderRadius: "13px",

                    display: "flex",

                    alignItems: "center",

                    justifyContent: "center",

                    background:
                      "linear-gradient(135deg, #E8F5EE, #DFF2E8)",
                  }}
                >
                  <NatureOutlinedIcon
                    sx={{
                      color: "#16804F",

                      fontSize: {
                        xs: 24,
                        sm: 26,
                      },
                    }}
                  />
                </Box>

                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    sx={{
                      fontSize: {
                        xs: 20,
                        sm: 21,
                      },

                      fontWeight: 900,

                      color: "#0F6B40",

                      lineHeight: 1.1,
                    }}
                  >
                    CarbonTrack
                  </Typography>

                  <Typography
                    sx={{
                      fontSize: 8.5,
                      color: "#829189",
                      letterSpacing: 1,
                      fontWeight: 700,

                      whiteSpace: "nowrap",
                    }}
                  >
                    SUSTAINABILITY PLATFORM
                  </Typography>
                </Box>
              </Stack>

              {/* =================================================
                  SMALL LABEL
              ================================================= */}

              <Stack
                direction="row"
                spacing={0.7}
                sx={{
                  alignItems: "center",
                  mb: 1.2,
                }}
              >
                <Box
                  sx={{
                    width: 7,
                    height: 7,

                    minWidth: 7,

                    borderRadius: "50%",

                    backgroundColor: "#16804F",

                    boxShadow:
                      "0 0 0 4px rgba(22,128,79,0.10)",
                  }}
                />

                <Typography
                  sx={{
                    fontSize: 10.5,
                    fontWeight: 800,
                    color: "#16804F",
                    letterSpacing: 1,
                    textTransform: "uppercase",
                  }}
                >
                  Welcome back
                </Typography>
              </Stack>

              {/* =================================================
                  HEADING
              ================================================= */}

              <Typography
                sx={{
                  fontSize: {
                    xs: 27,
                    sm: 32,
                    md: 36,
                  },

                  fontWeight: 900,

                  color: "#17221C",

                  letterSpacing: {
                    xs: "-1px",
                    sm: "-1.2px",
                    md: "-1.3px",
                  },

                  lineHeight: 1.1,

                  mb: 1.2,
                }}
              >
                Sign in to your
                <br />

                <Box
                  component="span"
                  sx={{
                    color: "#16804F",
                  }}
                >
                  CarbonTrack account
                </Box>
              </Typography>

              <Typography
                sx={{
                  color: "#718078",

                  fontSize: {
                    xs: 13,
                    sm: 14,
                  },

                  lineHeight: 1.65,

                  mb: {
                    xs: 2,
                    sm: 2.5,
                  },

                  maxWidth: 390,
                }}
              >
                Continue your sustainability journey
                and keep your environmental impact
                moving in the right direction.
              </Typography>

              {/* =================================================
                  ERROR
              ================================================= */}

              {error && (
                <Alert
                  severity="error"
                  onClose={() => setError("")}
                  sx={{
                    mb: 2.5,

                    borderRadius: "13px",

                    fontSize: 12.5,

                    alignItems: "center",

                    "& .MuiAlert-message": {
                      minWidth: 0,

                      overflowWrap: "anywhere",
                    },
                  }}
                >
                  {error}
                </Alert>
              )}

              {/* =================================================
                  GOOGLE LOGIN
              ================================================= */}

              <Box
                sx={{
                  width: "100%",

                  position: "relative",

                  minHeight: 44,

                  overflow: "hidden",
                }}
              >
                {googleLoading && (
                  <Box
                    sx={{
                      position: "absolute",

                      inset: 0,

                      zIndex: 5,

                      display: "flex",

                      alignItems: "center",

                      justifyContent: "center",

                      borderRadius: "12px",

                      backgroundColor:
                        "rgba(255,255,255,0.90)",

                      backdropFilter: "blur(5px)",
                    }}
                  >
                    <Stack
                      direction="row"
                      spacing={1}
                      sx={{
                        alignItems: "center",
                      }}
                    >
                      <CircularProgress
                        size={18}
                        sx={{
                          color: "#16804F",
                        }}
                      />

                      <Typography
                        sx={{
                          fontSize: 12,

                          fontWeight: 800,

                          color: "#146B43",
                        }}
                      >
                        Signing in securely...
                      </Typography>
                    </Stack>
                  </Box>
                )}

                <Box
                  sx={{
                    width: "100%",

                    display: "flex",

                    justifyContent: "center",

                    overflow: "hidden",

                    "& > div": {
                      width: "100% !important",

                      maxWidth:
                        "100% !important",
                    },

                    "& iframe": {
                      width: "100% !important",

                      maxWidth:
                        "100% !important",

                      minWidth: "0 !important",
                    },
                  }}
                >
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    useOneTap={false}
                    theme="outline"
                    size="large"
                    text="continue_with"
                    shape="rectangular"
                    width="100%"
                  />
                </Box>
              </Box>

              {/* =================================================
                  DIVIDER
              ================================================= */}

              <Stack
                direction="row"
                spacing={{
                  xs: 1,
                  sm: 1.5,
                }}
                sx={{
                  alignItems: "center",

                  my: {
                    xs: 1.8,
                    sm: 2,
                  },

                  width: "100%",
                }}
              >
                <Divider
                  sx={{
                    flex: 1,
                    borderColor: "#E5ECE8",
                  }}
                />

                <Typography
                  sx={{
                    fontSize: {
                      xs: 8.5,
                      sm: 9.5,
                    },

                    fontWeight: 800,

                    color: "#A1AAA5",

                    letterSpacing: 0.8,

                    whiteSpace: "nowrap",
                  }}
                >
                  OR CONTINUE WITH EMAIL
                </Typography>

                <Divider
                  sx={{
                    flex: 1,
                    borderColor: "#E5ECE8",
                  }}
                />
              </Stack>

              {/* =================================================
                  EMAIL FORM
              ================================================= */}

              <Box
                component="form"
                onSubmit={handleSubmit}
                sx={{
                  width: "100%",
                }}
              >
                {/* EMAIL */}

                <Typography
                  sx={{
                    mb: 0.8,

                    fontSize: 12.5,

                    fontWeight: 800,

                    color: "#34423A",
                  }}
                >
                  Email address
                </Typography>

                <TextField
                  fullWidth
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="you@example.com"
                  type="email"
                  autoComplete="email"
                  required
                  disabled={
                    loading || googleLoading
                  }
                  sx={{
                    ...fieldStyle,

                    mb: {
                      xs: 1.7,
                      sm: 2,
                    },

                    minWidth: 0,
                  }}
                />

                {/* PASSWORD */}

                <Typography
                  sx={{
                    mb: 0.8,

                    fontSize: 12.5,

                    fontWeight: 800,

                    color: "#34423A",
                  }}
                >
                  Password
                </Typography>

                <TextField
                  fullWidth
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="Enter your password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  autoComplete="current-password"
                  required
                  disabled={
                    loading || googleLoading
                  }
                  sx={{
                    ...fieldStyle,

                    minWidth: 0,
                  }}
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            type="button"
                            aria-label={
                              showPassword
                                ? "Hide password"
                                : "Show password"
                            }
                            onClick={() =>
                              setShowPassword(
                                (previous) =>
                                  !previous
                              )
                            }
                            edge="end"
                            sx={{
                              color: "#7A8981",

                              "&:hover": {
                                color: "#16804F",

                                backgroundColor:
                                  "#EAF6EF",
                              },
                            }}
                          >
                            {showPassword ? (
                              <VisibilityOffOutlinedIcon
                                sx={{
                                  fontSize: 20,
                                }}
                              />
                            ) : (
                              <VisibilityOutlinedIcon
                                sx={{
                                  fontSize: 20,
                                }}
                              />
                            )}
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }}
                />

                {/* FORGOT PASSWORD */}

                <Box
                  sx={{
                    display: "flex",

                    justifyContent:
                      "flex-end",

                    mt: 1,

                    mb: {
                      xs: 2,
                      sm: 2.5,
                    },
                  }}
                >
                  <Typography
                    component={Link}
                    to="/forgot-password"
                    sx={{
                      fontSize: 12,

                      fontWeight: 800,

                      color: "#16804F",

                      textDecoration: "none",

                      "&:hover": {
                        textDecoration:
                          "underline",
                      },
                    }}
                  >
                    Forgot password?
                  </Typography>
                </Box>

                {/* =================================================
                    SIGN IN BUTTON
                ================================================= */}

                <Button
                  fullWidth
                  type="submit"
                  variant="contained"
                  disabled={
                    loading || googleLoading
                  }
                  endIcon={
                    !loading ? (
                      <ArrowForwardRoundedIcon />
                    ) : undefined
                  }
                  sx={{
                    height: 54,

                    minHeight: 54,

                    borderRadius: "14px",

                    textTransform: "none",

                    fontSize: {
                      xs: 13.5,
                      sm: 14.5,
                    },

                    fontWeight: 900,

                    background:
                      "linear-gradient(135deg, #16804F 0%, #0F6B40 100%)",

                    boxShadow:
                      "0 12px 28px rgba(22,128,79,0.22)",

                    transition:
                      "all 0.2s ease",

                    "&:hover": {
                      transform:
                        "translateY(-2px)",

                      background:
                        "linear-gradient(135deg, #0F6B40 0%, #0A5935 100%)",

                      boxShadow:
                        "0 16px 34px rgba(22,128,79,0.28)",
                    },

                    "&:active": {
                      transform:
                        "translateY(0)",
                    },

                    "&.Mui-disabled": {
                      background: "#AFC8BA",

                      color: "#FFFFFF",
                    },
                  }}
                >
                  {loading ? (
                    <Stack
                      direction="row"
                      spacing={1}
                      sx={{
                        alignItems: "center",
                      }}
                    >
                      <CircularProgress
                        size={19}
                        sx={{
                          color: "#FFFFFF",
                        }}
                      />

                      <span>
                        Signing in...
                      </span>
                    </Stack>
                  ) : (
                    "Sign in to CarbonTrack"
                  )}
                </Button>
              </Box>

              {/* =================================================
                  REGISTER
              ================================================= */}

              <Box
                sx={{
                  mt: {
                    xs: 2,
                    sm: 2.5,
                  },

                  pt: {
                    xs: 1.8,
                    sm: 2,
                  },

                  borderTop:
                    "1px solid #EEF2EF",

                  textAlign: "center",
                }}
              >
                <Typography
                  sx={{
                    fontSize: {
                      xs: 12.5,
                      sm: 13.5,
                    },

                    color: "#718078",
                  }}
                >
                  Don't have an account?{" "}

                  <Box
                    component={Link}
                    to="/register"
                    sx={{
                      color: "#16804F",

                      fontWeight: 900,

                      textDecoration: "none",

                      "&:hover": {
                        textDecoration:
                          "underline",
                      },
                    }}
                  >
                    Create an account
                  </Box>
                </Typography>
              </Box>

              {/* =================================================
                  FOOTER
              ================================================= */}

              <Stack
                direction="row"
                spacing={0.7}
                sx={{
                  justifyContent: "center",

                  alignItems: "center",

                  mt: {
                    xs: 2,
                    sm: 2.5,
                  },

                  textAlign: "center",

                  flexWrap: "wrap",
                }}
              >
                <InsightsRoundedIcon
                  sx={{
                    fontSize: 14,
                    color: "#A0ABA4",
                  }}
                />

                <Typography
                  sx={{
                    fontSize: 10.5,

                    color: "#A0ABA4",

                    lineHeight: 1.5,
                  }}
                >
                  Sustainable choices ·
                  Measurable impact
                </Typography>
              </Stack>

              <Typography
                sx={{
                  mt: 1.3,

                  textAlign: "center",

                  fontSize: 10,

                  color: "#B4BCB7",
                }}
              >
                © {new Date().getFullYear()} CarbonTrack
              </Typography>
            </Box>
          </CardContent>
        </Box>
      </Card>
    </Box>
  );
};

export default Login;