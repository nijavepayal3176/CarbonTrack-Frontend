
import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  Alert,
  Box,
  Button,
  Card,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";

import NatureOutlinedIcon from "@mui/icons-material/NatureOutlined";
import MarkEmailReadOutlinedIcon from "@mui/icons-material/MarkEmailReadOutlined";
import LockResetOutlinedIcon from "@mui/icons-material/LockResetOutlined";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";

import api from "../services/api";

const ForgotPassword = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [resetUrl, setResetUrl] = useState("");

  // =========================================================
  // SEND RESET LINK
  // =========================================================

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post(
        "/auth/forgot-password",
        {
          email: cleanEmail,
        }
      );

      /*
       * Backend already generates:
       *
       * http://localhost:5173/reset-password/:token
       *
       * We keep that URL internally.
       *
       * IMPORTANT:
       * We DO NOT display it as a clickable raw URL.
       * We show a professional "Create New Password"
       * button instead.
       */

      const generatedResetUrl =
        response.data?.resetUrl;

      if (!generatedResetUrl) {
        throw new Error(
          "Password reset link could not be generated."
        );
      }

      setResetUrl(generatedResetUrl);

      /*
       * Move the UI from:
       *
       * Forgot password form
       *
       * to:
       *
       * Reset link ready
       */

      setSuccess(true);
      setEmail("");
    } catch (err: any) {
      console.error(
        "FORGOT PASSWORD ERROR:",
        err
      );

      const backendMessage =
        err?.response?.data?.message;

      setError(
        backendMessage ||
          err?.message ||
          "Unable to generate the password reset link. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // CREATE NEW PASSWORD
  // =========================================================

  const handleCreateNewPassword = () => {
    setError("");

    if (!resetUrl) {
      setError(
        "Password reset link is unavailable. Please request a new one."
      );
      return;
    }

    try {
      const url = new URL(resetUrl);

      /*
       * Backend is expected to generate:
       *
       * /reset-password/:token
       *
       * Extract the pathname and navigate directly.
       *
       * This prevents:
       *
       * /forgot-password
       *
       * from opening again.
       */

      const resetPath = url.pathname;

      if (
        !resetPath.startsWith(
          "/reset-password/"
        )
      ) {
        throw new Error(
          "Invalid reset password URL."
        );
      }

      navigate(resetPath);
    } catch (navigationError) {
      console.error(
        "RESET PASSWORD NAVIGATION ERROR:",
        navigationError
      );

      setError(
        "Invalid password reset link. Please request a new reset link."
      );
    }
  };

  // =========================================================
  // MAIN UI
  // =========================================================

  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100%",

        display: "flex",
        alignItems: "center",
        justifyContent: "center",

        px: 2,
        py: {
          xs: 2,
          sm: 3,
        },

        background:
          "radial-gradient(circle at 10% 10%, rgba(22,128,79,0.10), transparent 30%), radial-gradient(circle at 90% 90%, rgba(22,128,79,0.08), transparent 32%), #F5F8F6",

        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* =====================================================
          DECORATIVE BACKGROUND
      ===================================================== */}

      <Box
        sx={{
          position: "absolute",
          width: 330,
          height: 330,
          borderRadius: "50%",
          border:
            "1px solid rgba(22,128,79,0.07)",
          top: -160,
          left: -140,
          pointerEvents: "none",
        }}
      />

      <Box
        sx={{
          position: "absolute",
          width: 430,
          height: 430,
          borderRadius: "50%",
          border:
            "1px solid rgba(22,128,79,0.06)",
          bottom: -260,
          right: -200,
          pointerEvents: "none",
        }}
      />

      {/* =====================================================
          CARD
      ===================================================== */}

      <Card
        elevation={0}
        sx={{
          width: "100%",
          maxWidth: 470,

          borderRadius: {
            xs: 3,
            sm: 4,
          },

          p: {
            xs: 3,
            sm: 4.5,
          },

          border:
            "1px solid rgba(22,128,79,0.10)",

          boxShadow:
            "0 25px 70px rgba(23,72,48,0.12)",

          backgroundColor: "#FFFFFF",

          position: "relative",
          zIndex: 1,
        }}
      >
        {/* =====================================================
            BRAND
        ===================================================== */}

        <Stack
          direction="row"
          spacing={1.3}
          sx={{
            alignItems: "center",
            justifyContent: "center",
            mb: 4
          }}>
          <Box
            sx={{
              width: 47,
              height: 47,
              borderRadius: 2.5,

              display: "flex",
              alignItems: "center",
              justifyContent: "center",

              background:
                "linear-gradient(135deg, #E8F5EE, #DDF1E6)",
            }}
          >
            <NatureOutlinedIcon
              sx={{
                fontSize: 27,
                color: "#16804F",
              }}
            />
          </Box>

          <Box>
            <Typography
              sx={{
                fontSize: 22,
                fontWeight: 900,
                color: "#0F6B40",
                lineHeight: 1,
              }}
            >
              CarbonTrack
            </Typography>

            <Typography
              sx={{
                mt: 0.5,
                fontSize: 9.5,
                color: "#87948D",
                letterSpacing: 1,
              }}
            >
              SUSTAINABILITY PLATFORM
            </Typography>
          </Box>
        </Stack>

        {/* =====================================================
            REQUEST RESET STATE
        ===================================================== */}

        {!success ? (
          <>
            {/* Icon */}

            <Box
              sx={{
                width: 68,
                height: 68,
                mx: "auto",
                mb: 2.5,

                borderRadius: "50%",

                display: "flex",
                alignItems: "center",
                justifyContent: "center",

                background:
                  "linear-gradient(135deg, #E8F5EE, #D9F0E3)",

                color: "#16804F",

                boxShadow:
                  "0 10px 25px rgba(22,128,79,0.10)",
              }}
            >
              <MarkEmailReadOutlinedIcon
                sx={{
                  fontSize: 34,
                }}
              />
            </Box>

            {/* Heading */}

            <Typography
              sx={{
                textAlign: "center",

                fontSize: {
                  xs: 27,
                  sm: 31,
                },

                fontWeight: 900,

                color: "#17221C",

                letterSpacing: "-0.8px",
              }}
            >
              Forgot your password?
            </Typography>

            <Typography
              sx={{
                mt: 1,
                mb: 3.5,

                textAlign: "center",

                color: "#718078",

                fontSize: 14,
                lineHeight: 1.6,
              }}
            >
              Enter the email address associated
              with your CarbonTrack account and
              create a new password securely.
            </Typography>

            {/* Error */}

            {error && (
              <Alert
                severity="error"
                onClose={() =>
                  setError("")
                }
                sx={{
                  mb: 2.5,
                  borderRadius: 2,
                  fontSize: 13,
                }}
              >
                {error}
              </Alert>
            )}

            {/* Email form */}

            <Box
              component="form"
              onSubmit={handleSubmit}
            >
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

              <Box
                sx={{
                  mb: 2.2,

                  "& .MuiOutlinedInput-root": {
                    minHeight: 52,
                    borderRadius: 2.2,
                    backgroundColor:
                      "#FAFCFB",

                    "& fieldset": {
                      borderColor:
                        "#DDE7E1",
                    },

                    "&:hover fieldset": {
                      borderColor:
                        "#A8CBB7",
                    },

                    "&.Mui-focused fieldset": {
                      borderColor:
                        "#16804F",
                      borderWidth: 1.5,
                    },
                  },
                }}
              >
                <input
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(
                      event.target.value
                    )
                  }
                  placeholder="you@example.com"
                  autoComplete="email"
                  disabled={loading}
                  required
                  style={{
                    width: "100%",
                    height: 52,
                    padding:
                      "0 16px",
                    border:
                      "1px solid #DDE7E1",
                    borderRadius: 10,
                    outline: "none",
                    background:
                      "#FAFCFB",
                    fontSize: 14,
                    boxSizing:
                      "border-box",
                  }}
                />
              </Box>

              {/* Send Reset Link */}

              <Button
                fullWidth
                type="submit"
                variant="contained"
                disabled={loading}
                sx={{
                  height: 52,

                  borderRadius: 2.2,

                  textTransform: "none",

                  fontSize: 14.5,
                  fontWeight: 900,

                  background:
                    "linear-gradient(135deg, #16804F, #0F6B40)",

                  boxShadow:
                    "0 10px 24px rgba(22,128,79,0.20)",

                  transition:
                    "all 0.2s ease",

                  "&:hover": {
                    transform:
                      "translateY(-1px)",

                    background:
                      "linear-gradient(135deg, #0F6B40, #0B5935)",

                    boxShadow:
                      "0 13px 28px rgba(22,128,79,0.27)",
                  },

                  "&.Mui-disabled": {
                    background:
                      "#AFC8BA",
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
                      size={20}
                      sx={{
                        color: "#FFFFFF",
                      }}
                    />

                    <span>
                      Generating reset link...
                    </span>
                  </Stack>
                ) : (
                  "Send Reset Link"
                )}
              </Button>
            </Box>

            {/* Back */}

            <Button
              component={Link}
              to="/login"
              startIcon={
                <ArrowBackOutlinedIcon />
              }
              sx={{
                mt: 2.5,
                mx: "auto",
                display: "flex",

                textTransform: "none",

                fontWeight: 800,
                fontSize: 13,

                color: "#64736B",

                "&:hover": {
                  color: "#16804F",
                  backgroundColor:
                    "#F0F8F3",
                },
              }}
            >
              Back to Sign in
            </Button>
          </>
        ) : (
          /* ===================================================
             RESET LINK READY
          =================================================== */

          <Box
            sx={{
              textAlign: "center",
              py: 1.5,
            }}
          >
            {/* Success icon */}

            <Box
              sx={{
                width: 76,
                height: 76,
                mx: "auto",
                mb: 2.5,

                borderRadius: "50%",

                display: "flex",
                alignItems: "center",
                justifyContent: "center",

                background:
                  "linear-gradient(135deg, #E8F5EE, #D9F0E3)",

                color: "#16804F",

                boxShadow:
                  "0 10px 25px rgba(22,128,79,0.10)",
              }}
            >
              <CheckCircleOutlineOutlinedIcon
                sx={{
                  fontSize: 43,
                }}
              />
            </Box>

            <Typography
              sx={{
                fontSize: {
                  xs: 26,
                  sm: 29,
                },

                fontWeight: 900,

                color: "#17221C",

                letterSpacing:
                  "-0.7px",
              }}
            >
              Reset link ready
            </Typography>

            <Typography
              sx={{
                mt: 1.2,
                mb: 3,

                color: "#718078",

                fontSize: 14,

                lineHeight: 1.7,
              }}
            >
              Your password reset request has
              been verified successfully.
              <br />
              Continue below to create your
              new password.
            </Typography>

            {/* =================================================
                CREATE NEW PASSWORD
            ================================================= */}

            <Button
              fullWidth
              variant="contained"
              onClick={
                handleCreateNewPassword
              }
              startIcon={
                <LockResetOutlinedIcon />
              }
              sx={{
                height: 52,

                borderRadius: 2.2,

                textTransform: "none",

                fontSize: 14.5,
                fontWeight: 900,

                background:
                  "linear-gradient(135deg, #16804F, #0F6B40)",

                boxShadow:
                  "0 10px 24px rgba(22,128,79,0.20)",

                transition:
                  "all 0.2s ease",

                "&:hover": {
                  transform:
                    "translateY(-1px)",

                  background:
                    "linear-gradient(135deg, #0F6B40, #0B5935)",

                  boxShadow:
                    "0 13px 28px rgba(22,128,79,0.27)",
                },
              }}
            >
              Create New Password
            </Button>

            {/* Error after reset navigation */}

            {error && (
              <Alert
                severity="error"
                onClose={() =>
                  setError("")
                }
                sx={{
                  mt: 2.5,
                  borderRadius: 2,
                  fontSize: 13,
                  textAlign: "left",
                }}
              >
                {error}
              </Alert>
            )}

            {/* Security message */}

            <Stack
              direction="row"
              spacing={0.7}
              sx={{
                justifyContent: "center",
                alignItems: "center",
                mt: 3
              }}>
              <NatureOutlinedIcon
                sx={{
                  fontSize: 14,
                  color: "#9BA7A0",
                }}
              />

              <Typography
                sx={{
                  fontSize: 10.5,
                  color: "#9BA7A0",
                }}
              >
                Secure password recovery
              </Typography>
            </Stack>
          </Box>
        )}

        {/* =====================================================
            FOOTER
        ===================================================== */}

        <Typography
          sx={{
            mt: 3,
            textAlign: "center",
            fontSize: 10.5,
            color: "#A8B1AC",
          }}
        >
          © {new Date().getFullYear()}{" "}
          CarbonTrack
        </Typography>
      </Card>
    </Box>
  );
};

export default ForgotPassword;
