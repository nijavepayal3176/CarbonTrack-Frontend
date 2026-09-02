import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  Alert,
  Box,
  Button,
  Card,
  CircularProgress,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import NatureOutlinedIcon from "@mui/icons-material/NatureOutlined";
import LockResetOutlinedIcon from "@mui/icons-material/LockResetOutlined";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";

import api from "../services/api";

const ResetPassword = () => {
  const navigate = useNavigate();

  const { token } = useParams<{
    token: string;
  }>();

  const [password, setPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  const [loading, setLoading] =
    useState(false);

  const [success, setSuccess] =
    useState(false);

  const [error, setError] =
    useState("");

  const passwordStrength = useMemo(() => {
    if (!password) {
      return {
        label: "",
        width: "0%",
      };
    }

    if (password.length < 8) {
      return {
        label: "Too short",
        width: "30%",
      };
    }

    if (
      /[A-Z]/.test(password) &&
      /[0-9]/.test(password) &&
      /[^A-Za-z0-9]/.test(password)
    ) {
      return {
        label: "Strong password",
        width: "100%",
      };
    }

    if (
      /[A-Z]/.test(password) ||
      /[0-9]/.test(password)
    ) {
      return {
        label: "Good password",
        width: "70%",
      };
    }

    return {
      label: "Weak password",
      width: "45%",
    };
  }, [password]);

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");

    if (!token) {
      setError(
        "Invalid or missing password reset link."
      );
      return;
    }

    if (!password || !confirmPassword) {
      setError(
        "Please enter your new password and confirm it."
      );
      return;
    }

    if (password.length < 8) {
      setError(
        "Password must contain at least 8 characters."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError(
        "Passwords do not match."
      );
      return;
    }

    setLoading(true);

    try {
      await api.post(
        `/auth/reset-password/${token}`,
        {
          password,
          confirmPassword,
        }
      );

      setSuccess(true);

      setPassword("");
      setConfirmPassword("");

      /*
       * Give user a moment to see success state,
       * then return to login.
       */
      setTimeout(() => {
        navigate("/login", {
          replace: true,
        });
      }, 2200);
    } catch (err: any) {
      console.error(
        "RESET PASSWORD ERROR:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Unable to reset your password. Please request a new reset link."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100%",

        display: "flex",
        alignItems: "center",
        justifyContent: "center",

        px: 2,
        py: 3,

        background:
          "radial-gradient(circle at 10% 10%, rgba(22,128,79,0.10), transparent 30%), radial-gradient(circle at 90% 90%, rgba(22,128,79,0.08), transparent 32%), #F5F8F6",
      }}
    >
      {/* Decorative background */}

      <Box
        sx={{
          position: "fixed",
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
          position: "fixed",
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

      <Card
        elevation={0}
        sx={{
          width: "100%",
          maxWidth: 480,

          borderRadius: 4,

          p: {
            xs: 3,
            sm: 4.5,
          },

          border:
            "1px solid rgba(22,128,79,0.10)",

          boxShadow:
            "0 25px 70px rgba(23,72,48,0.12)",

          backgroundColor: "#FFFFFF",
        }}
      >
        {/* =================================================
            BRAND
        ================================================= */}

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

        {!success ? (
          <>
            {/* =================================================
                ICON
            ================================================= */}

            <Box
              sx={{
                width: 70,
                height: 70,
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
              <LockResetOutlinedIcon
                sx={{
                  fontSize: 36,
                }}
              />
            </Box>

            {/* =================================================
                HEADING
            ================================================= */}

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
              Create new password
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
              Choose a strong password to secure
              your CarbonTrack account.
            </Typography>

            {/* =================================================
                ERROR
            ================================================= */}

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

            {/* =================================================
                FORM
            ================================================= */}

            <Box
              component="form"
              onSubmit={handleSubmit}
            >
              {/* New password */}

              <Typography
                sx={{
                  mb: 0.8,
                  fontSize: 12.5,
                  fontWeight: 800,
                  color: "#34423A",
                }}
              >
                New password
              </Typography>

              <TextField
                fullWidth
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                value={password}
                onChange={(event) =>
                  setPassword(
                    event.target.value
                  )
                }
                placeholder="Enter new password"
                autoComplete="new-password"
                disabled={loading}
                sx={{
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
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          type="button"
                          onClick={() =>
                            setShowPassword(
                              (value) =>
                                !value
                            )
                          }
                          edge="end"
                          aria-label={
                            showPassword
                              ? "Hide password"
                              : "Show password"
                          }
                        >
                          {showPassword ? (
                            <VisibilityOffOutlinedIcon />
                          ) : (
                            <VisibilityOutlinedIcon />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />

              {/* Password strength */}

              {password && (
                <Box sx={{ mt: 1.2, mb: 2 }}>
                  <Box
                    sx={{
                      height: 5,
                      borderRadius: 10,
                      backgroundColor:
                        "#E8EFEB",
                      overflow: "hidden",
                    }}
                  >
                    <Box
                      sx={{
                        width:
                          passwordStrength.width,
                        height: "100%",
                        borderRadius: 10,
                        backgroundColor:
                          "#16804F",
                        transition:
                          "width 0.25s ease",
                      }}
                    />
                  </Box>

                  <Typography
                    sx={{
                      mt: 0.6,
                      fontSize: 10.5,
                      color: "#718078",
                    }}
                  >
                    {passwordStrength.label}
                  </Typography>
                </Box>
              )}

              {/* Confirm password */}

              <Typography
                sx={{
                  mb: 0.8,
                  mt: password
                    ? 1.5
                    : 2.2,

                  fontSize: 12.5,
                  fontWeight: 800,
                  color: "#34423A",
                }}
              >
                Confirm new password
              </Typography>

              <TextField
                fullWidth
                type={
                  showConfirmPassword
                    ? "text"
                    : "password"
                }
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(
                    event.target.value
                  )
                }
                placeholder="Re-enter new password"
                autoComplete="new-password"
                disabled={loading}
                error={
                  Boolean(
                    confirmPassword
                  ) &&
                  password !==
                    confirmPassword
                }
                helperText={
                  confirmPassword &&
                  password !==
                    confirmPassword
                    ? "Passwords do not match"
                    : ""
                }
                sx={{
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
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          type="button"
                          onClick={() =>
                            setShowConfirmPassword(
                              (value) =>
                                !value
                            )
                          }
                          edge="end"
                          aria-label={
                            showConfirmPassword
                              ? "Hide password"
                              : "Show password"
                          }
                        >
                          {showConfirmPassword ? (
                            <VisibilityOffOutlinedIcon />
                          ) : (
                            <VisibilityOutlinedIcon />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />

              {/* Submit */}

              <Button
                fullWidth
                type="submit"
                variant="contained"
                disabled={loading}
                sx={{
                  mt: 2.5,
                  height: 52,

                  borderRadius: 2.2,

                  textTransform: "none",

                  fontSize: 14.5,
                  fontWeight: 900,

                  background:
                    "linear-gradient(135deg, #16804F, #0F6B40)",

                  boxShadow:
                    "0 10px 24px rgba(22,128,79,0.20)",

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
                      Resetting password...
                    </span>
                  </Stack>
                ) : (
                  "Reset Password"
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
          /* =================================================
             SUCCESS STATE
          ================================================= */

          <Box
            sx={{
              textAlign: "center",
              py: 2,
            }}
          >
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
                fontSize: 28,
                fontWeight: 900,
                color: "#17221C",
              }}
            >
              Password updated!
            </Typography>

            <Typography
              sx={{
                mt: 1.2,
                color: "#718078",
                fontSize: 14,
                lineHeight: 1.7,
              }}
            >
              Your CarbonTrack password has
              been changed successfully.
              <br />
              Redirecting you to sign in...
            </Typography>

            <CircularProgress
              size={22}
              sx={{
                mt: 3,
                color: "#16804F",
              }}
            />
          </Box>
        )}

        {/* Footer */}

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

export default ResetPassword;