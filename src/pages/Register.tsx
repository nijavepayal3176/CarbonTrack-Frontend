
import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  IconButton,
  InputAdornment,
  LinearProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import NatureOutlinedIcon from "@mui/icons-material/NatureOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import CloudOutlinedIcon from "@mui/icons-material/CloudOutlined";
import TrendingDownOutlinedIcon from "@mui/icons-material/TrendingDownOutlined";
import TrackChangesOutlinedIcon from "@mui/icons-material/TrackChangesOutlined";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import AutoGraphRoundedIcon from "@mui/icons-material/AutoGraphRounded";

import { useAuth } from "../context/AuthContext";

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // =========================================================
  // PASSWORD STRENGTH — UI ONLY
  // =========================================================

  const passwordStrength = useMemo(() => {
    let score = 0;

    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (!password) {
      return {
        score: 0,
        label: "",
        percentage: 0,
      };
    }

    if (score <= 1) {
      return {
        score,
        label: "Weak password",
        percentage: 25,
      };
    }

    if (score === 2) {
      return {
        score,
        label: "Fair password",
        percentage: 50,
      };
    }

    if (score === 3) {
      return {
        score,
        label: "Good password",
        percentage: 75,
      };
    }

    return {
      score,
      label: "Strong password",
      percentage: 100,
    };
  }, [password]);

  // =========================================================
  // REGISTER
  // =========================================================

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");

    if (
      !name.trim() ||
      !email.trim() ||
      !password.trim()
    ) {
      setError(
        "Please complete all required fields."
      );
      return;
    }

    setLoading(true);

    try {
      await register(
        name.trim(),
        email.trim(),
        password
      );

      navigate("/login", {
        replace: true,
      });
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to create account. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // INPUT STYLE
  // =========================================================

  const fieldStyle = {
    "& .MuiOutlinedInput-root": {
      minHeight: 52,
      borderRadius: "13px",
      backgroundColor: "#F9FBFA",
      fontSize: "0.92rem",
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
      padding: "14px 15px",
    },

    "& .MuiInputBase-input::placeholder": {
      color: "#A0AAA5",
      opacity: 1,
    },
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100%",
        position: "relative",
        overflow: "hidden",

        display: "flex",
        alignItems: "center",
        justifyContent: "center",

        px: {
          xs: 1.5,
          sm: 3,
          md: 4,
        },

        py: {
          xs: 1.5,
          md: 2,
        },

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
          width: 480,
          height: 480,
          borderRadius: "50%",
          border:
            "1px solid rgba(22,128,79,0.08)",
          top: -270,
          left: -220,
          pointerEvents: "none",
        }}
      />

      <Box
        sx={{
          position: "absolute",
          width: 650,
          height: 650,
          borderRadius: "50%",
          border:
            "1px solid rgba(22,128,79,0.07)",
          bottom: -390,
          right: -300,
          pointerEvents: "none",
        }}
      />

      <Box
        sx={{
          position: "absolute",
          width: 10,
          height: 10,
          borderRadius: "50%",
          backgroundColor: "#16804F",
          opacity: 0.15,
          top: "17%",
          left: "8%",
        }}
      />

      <Box
        sx={{
          position: "absolute",
          width: 7,
          height: 7,
          borderRadius: "50%",
          backgroundColor: "#16804F",
          opacity: 0.15,
          bottom: "18%",
          right: "11%",
        }}
      />

      {/* =====================================================
          MAIN CARD
      ===================================================== */}

      <Card
        elevation={0}
        sx={{
          width: "100%",
          maxWidth: 1040,

          borderRadius: {
            xs: 3,
            md: 4,
          },

          overflow: "hidden",

          border:
            "1px solid rgba(22,128,79,0.10)",

          backgroundColor: "#FFFFFF",

          boxShadow:
            "0 28px 70px rgba(23,72,48,0.13)",

          position: "relative",
          zIndex: 1,
        }}
      >
        <Box
          sx={{
            display: "grid",

            gridTemplateColumns: {
              xs: "1fr",
              md: "0.94fr 1.06fr",
            },
          }}
        >
          {/* =================================================
              LEFT PREMIUM BRAND PANEL
          ================================================= */}

          <Box
            sx={{
              display: {
                xs: "none",
                md: "flex",
              },

              minHeight: 600,

              position: "relative",
              overflow: "hidden",

              flexDirection: "column",
              justifyContent: "space-between",

              p: {
                md: 4,
                lg: 4.8,
              },

              color: "#FFFFFF",

              background:
                "linear-gradient(145deg, #052C1C 0%, #08472D 35%, #0E6840 67%, #16804F 100%)",
            }}
          >
            {/* Decorative circles */}

            <Box
              sx={{
                position: "absolute",
                width: 470,
                height: 470,
                borderRadius: "50%",
                border:
                  "1px solid rgba(255,255,255,0.10)",
                top: -245,
                right: -190,
              }}
            />

            <Box
              sx={{
                position: "absolute",
                width: 350,
                height: 350,
                borderRadius: "50%",
                border:
                  "1px solid rgba(255,255,255,0.07)",
                top: -180,
                right: -135,
              }}
            />

            <Box
              sx={{
                position: "absolute",
                width: 520,
                height: 520,
                borderRadius: "50%",
                border:
                  "1px solid rgba(255,255,255,0.06)",
                bottom: -340,
                left: -300,
              }}
            />

            <Box
              sx={{
                position: "absolute",
                width: 230,
                height: 230,
                borderRadius: "50%",
                background:
                  "rgba(255,255,255,0.035)",
                top: "43%",
                right: -75,
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
                  alignItems: "center"
                }}
              >
                <Box
                  sx={{
                    width: 55,
                    height: 55,
                    borderRadius: "17px",

                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",

                    background:
                      "linear-gradient(145deg, rgba(255,255,255,0.20), rgba(255,255,255,0.07))",

                    border:
                      "1px solid rgba(255,255,255,0.17)",

                    boxShadow:
                      "0 12px 32px rgba(0,0,0,0.15)",

                    backdropFilter: "blur(12px)",
                  }}
                >
                  <NatureOutlinedIcon
                    sx={{
                      fontSize: 32,
                      color: "#FFFFFF",
                    }}
                  />
                </Box>

                <Box>
                  <Typography
                    sx={{
                      fontSize: 24,
                      fontWeight: 900,
                      lineHeight: 1,
                      letterSpacing: "-0.8px",
                    }}
                  >
                    CarbonTrack
                  </Typography>

                  <Typography
                    sx={{
                      mt: 0.8,
                      fontSize: 9.5,
                      opacity: 0.62,
                      letterSpacing: 1.6,
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

              <Box sx={{ mt: 6.5 }}>
                <Typography
                  sx={{
                    fontSize: {
                      md: 38,
                      lg: 45,
                    },

                    fontWeight: 900,

                    lineHeight: 1.07,

                    letterSpacing: "-1.9px",

                    maxWidth: 440,
                  }}
                >
                  One account.
                  <br />

                  <Box
                    component="span"
                    sx={{
                      color: "#9CF2BD",
                    }}
                  >
                    A greener future.
                  </Box>
                </Typography>

                <Typography
                  sx={{
                    mt: 2.4,
                    maxWidth: 420,

                    fontSize: 14.5,

                    lineHeight: 1.75,

                    color:
                      "rgba(255,255,255,0.70)",
                  }}
                >
                  Track your environmental impact,
                  discover meaningful insights and
                  turn everyday choices into measurable
                  sustainability progress.
                </Typography>
              </Box>

              {/* =================================================
                  JOURNEY BADGE
              ================================================= */}

              <Box
                sx={{
                  mt: 3.5,

                  display: "inline-flex",
                  alignItems: "center",
                  gap: 1.1,

                  px: 1.5,
                  py: 0.95,

                  borderRadius: "12px",

                  background:
                    "rgba(255,255,255,0.08)",

                  border:
                    "1px solid rgba(255,255,255,0.10)",

                  backdropFilter: "blur(10px)",
                }}
              >
                <AutoGraphRoundedIcon
                  sx={{
                    fontSize: 18,
                    color: "#9CF2BD",
                  }}
                />

                <Typography
                  sx={{
                    fontSize: 10.8,
                    fontWeight: 800,
                    color:
                      "rgba(255,255,255,0.84)",
                  }}
                >
                  Start measuring. Start improving.
                </Typography>
              </Box>
            </Box>

            {/* =================================================
                FEATURES
            ================================================= */}

            <Stack
              spacing={1.45}
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
                  spacing={1.4}
                  sx={{
                    alignItems: "center"
                  }}
                >
                  <Box
                    sx={{
                      width: 43,
                      height: 43,
                      minWidth: 43,

                      borderRadius: "13px",

                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",

                      color: "#FFFFFF",

                      background:
                        "rgba(255,255,255,0.085)",

                      border:
                        "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    {feature.icon}
                  </Box>

                  <Box>
                    <Typography
                      sx={{
                        fontSize: 12.8,
                        fontWeight: 800,
                      }}
                    >
                      {feature.title}
                    </Typography>

                    <Typography
                      sx={{
                        mt: 0.25,
                        fontSize: 10.7,
                        color:
                          "rgba(255,255,255,0.53)",
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
              RIGHT REGISTER PANEL
          ================================================= */}

          <CardContent
            sx={{
              p: {
                xs: 2.5,
                sm: 3.5,
                md: 4,
                lg: 4.8,
              },

              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <Box
              sx={{
                width: "100%",
                maxWidth: 440,
                mx: "auto",
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

                  mb: 3.2
                }}>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
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
                      fontSize: 26,
                    }}
                  />
                </Box>

                <Box>
                  <Typography
                    sx={{
                      fontSize: 21,
                      fontWeight: 900,
                      color: "#0F6B40",
                    }}
                  >
                    CarbonTrack
                  </Typography>

                  <Typography
                    sx={{
                      fontSize: 9,
                      color: "#829189",
                      letterSpacing: 1,
                      fontWeight: 700,
                    }}
                  >
                    SUSTAINABILITY PLATFORM
                  </Typography>
                </Box>
              </Stack>

              {/* =================================================
                  LABEL
              ================================================= */}

              <Stack
                direction="row"
                spacing={0.8}
                sx={{
                  alignItems: "center",
                  mb: 1.15
                }}>
                <Box
                  sx={{
                    width: 7,
                    height: 7,
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
                  Get started
                </Typography>
              </Stack>

              {/* =================================================
                  HEADING
              ================================================= */}

              <Typography
                sx={{
                  fontSize: {
                    xs: 29,
                    sm: 35,
                  },

                  fontWeight: 900,

                  color: "#17221C",

                  letterSpacing: "-1.4px",

                  lineHeight: 1.08,

                  mb: 1.15,
                }}
              >
                Create your
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

                  fontSize: 13.8,

                  lineHeight: 1.65,

                  mb: 2.4,

                  maxWidth: 395,
                }}
              >
                Join CarbonTrack and start turning
                everyday choices into measurable
                environmental progress.
              </Typography>

              {/* =================================================
                  ERROR
              ================================================= */}

              {error && (
                <Alert
                  severity="error"
                  onClose={() => setError("")}
                  sx={{
                    mb: 2,
                    borderRadius: "13px",
                    fontSize: 12.5,
                    alignItems: "center",
                  }}
                >
                  {error}
                </Alert>
              )}

              {/* =================================================
                  FORM
              ================================================= */}

              <Box
                component="form"
                onSubmit={handleSubmit}
              >
                {/* FULL NAME */}

                <Typography
                  sx={{
                    mb: 0.7,
                    fontSize: 12,
                    fontWeight: 800,
                    color: "#34423A",
                  }}
                >
                  Full name
                </Typography>

                <TextField
                  fullWidth
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  placeholder="Enter your full name"
                  autoComplete="name"
                  required
                  disabled={loading}
                  sx={{
                    ...fieldStyle,
                    mb: 1.55,
                  }}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonOutlineOutlinedIcon
                            sx={{
                              fontSize: 20,
                              color: "#7A8981",
                            }}
                          />
                        </InputAdornment>
                      ),
                    },
                  }}
                />

                {/* EMAIL */}

                <Typography
                  sx={{
                    mb: 0.7,
                    fontSize: 12,
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
                  disabled={loading}
                  sx={{
                    ...fieldStyle,
                    mb: 1.55,
                  }}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailOutlinedIcon
                            sx={{
                              fontSize: 20,
                              color: "#7A8981",
                            }}
                          />
                        </InputAdornment>
                      ),
                    },
                  }}
                />

                {/* PASSWORD */}

                <Typography
                  sx={{
                    mb: 0.7,
                    fontSize: 12,
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
                  placeholder="Create a secure password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  autoComplete="new-password"
                  required
                  disabled={loading}
                  sx={{
                    ...fieldStyle,
                  }}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockOutlinedIcon
                            sx={{
                              fontSize: 20,
                              color: "#7A8981",
                            }}
                          />
                        </InputAdornment>
                      ),

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

                {/* =================================================
                    PASSWORD STRENGTH
                ================================================= */}

                {password && (
                  <Box sx={{ mt: 1 }}>
                    <Stack
                      direction="row"
                      sx={{
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: 0.5
                      }}>
                      <Typography
                        sx={{
                          fontSize: 10.5,
                          color: "#7D8983",
                        }}
                      >
                        Password strength
                      </Typography>

                      <Typography
                        sx={{
                          fontSize: 10.5,
                          fontWeight: 800,
                          color:
                            passwordStrength.score >= 3
                              ? "#16804F"
                              : "#87938C",
                        }}
                      >
                        {passwordStrength.label}
                      </Typography>
                    </Stack>

                    <LinearProgress
                      variant="determinate"
                      value={
                        passwordStrength.percentage
                      }
                      sx={{
                        height: 4,
                        borderRadius: 10,
                        backgroundColor: "#E7EEE9",

                        "& .MuiLinearProgress-bar": {
                          borderRadius: 10,
                          backgroundColor:
                            "#16804F",
                        },
                      }}
                    />
                  </Box>
                )}

                {/* PASSWORD REQUIREMENT */}

                <Stack
                  direction="row"
                  spacing={0.7}
                  sx={{
                    alignItems: "center",
                    mt: 1.25,
                    mb: 2.2
                  }}>
                  <CheckCircleRoundedIcon
                    sx={{
                      fontSize: 15,
                      color: "#16804F",
                    }}
                  />

                  <Typography
                    sx={{
                      fontSize: 10.6,
                      color: "#7C8982",
                    }}
                  >
                    Use at least 8 characters for better security
                  </Typography>
                </Stack>

                {/* =================================================
                    CREATE ACCOUNT
                ================================================= */}

                <Button
                  fullWidth
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  endIcon={
                    !loading ? (
                      <ArrowForwardRoundedIcon />
                    ) : undefined
                  }
                  sx={{
                    height: 54,

                    borderRadius: "14px",

                    textTransform: "none",

                    fontSize: 14.5,

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
                        alignItems: "center"
                      }}
                    >
                      <CircularProgress
                        size={19}
                        sx={{
                          color: "#FFFFFF",
                        }}
                      />

                      <span>
                        Creating account...
                      </span>
                    </Stack>
                  ) : (
                    "Create CarbonTrack Account"
                  )}
                </Button>
              </Box>

              {/* =================================================
                  LOGIN
              ================================================= */}

              <Box
                sx={{
                  mt: 2.3,
                  pt: 1.9,

                  borderTop:
                    "1px solid #EEF2EF",

                  textAlign: "center",
                }}
              >
                <Typography
                  sx={{
                    fontSize: 13.2,
                    color: "#718078",
                  }}
                >
                  Already have an account?{" "}
                  <Box
                    component={Link}
                    to="/login"
                    sx={{
                      color: "#16804F",
                      fontWeight: 900,
                      textDecoration: "none",

                      "&:hover": {
                        textDecoration: "underline",
                      },
                    }}
                  >
                    Sign in
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
                  mt: 1.8
                }}>
                <NatureOutlinedIcon
                  sx={{
                    fontSize: 14,
                    color: "#A0ABA4",
                  }}
                />

                <Typography
                  sx={{
                    fontSize: 10.3,
                    color: "#A0ABA4",
                  }}
                >
                  Sustainable choices · Measurable impact
                </Typography>
              </Stack>

              <Typography
                sx={{
                  mt: 1,
                  textAlign: "center",
                  fontSize: 9.8,
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

export default Register;
