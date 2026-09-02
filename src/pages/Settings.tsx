import {
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { useNavigate } from "react-router-dom";
import axios from "axios";

import { useAuth } from "../context/AuthContext";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  IconButton,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  Switch,
  Typography,
} from "@mui/material";


import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PaletteOutlinedIcon from "@mui/icons-material/PaletteOutlined";
import SecurityOutlinedIcon from "@mui/icons-material/SecurityOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";


const API_BASE_URL = "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("carbontrack_token") || localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/* =========================================================
   TYPES
========================================================= */

interface StoredSettings {
  darkMode: boolean;
}

/* =========================================================
   STORAGE KEY
========================================================= */

const SETTINGS_STORAGE_KEY =
  "carbontrack_settings";

/* =========================================================
   DEFAULT SETTINGS
========================================================= */

const DEFAULT_SETTINGS: StoredSettings = {
  darkMode: false,
};

/* =========================================================
   SETTINGS COMPONENT
========================================================= */

const Settings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  /* -------------------------------------------------------
     SETTINGS STATE
  ------------------------------------------------------- */

  const [darkMode, setDarkMode] =
    useState(false);

  /* -------------------------------------------------------
     USER STATE
  ------------------------------------------------------- */

  /* -------------------------------------------------------
     UI STATE
  ------------------------------------------------------- */

  const [snackbarOpen, setSnackbarOpen] =
    useState(false);

  const [snackbarMessage, setSnackbarMessage] =
    useState("");

  const [snackbarSeverity, setSnackbarSeverity] =
    useState<"success" | "error" | "info">(
      "success"
    );

  /* =======================================================
     LOAD SETTINGS
  ======================================================= */

  useEffect(() => {
    try {
      const storedSettings =
        localStorage.getItem(
          SETTINGS_STORAGE_KEY
        );

      if (!storedSettings) {
        return;
      }

      const parsedSettings =
        JSON.parse(
          storedSettings
        ) as Partial<StoredSettings>;

      setDarkMode(
        parsedSettings.darkMode ??
          DEFAULT_SETTINGS.darkMode
      );
    } catch (error) {
      console.error(
        "Failed to load settings:",
        error
      );
    }
  }, []);

  /* =======================================================
     DARK MODE
  ======================================================= */

  useEffect(() => {
    if (darkMode) {
      document.body.style.backgroundColor =
        "#121A16";
    } else {
      document.body.style.backgroundColor =
        "#F6F9F7";
    }

    return () => {
      document.body.style.backgroundColor =
        "";
    };
  }, [darkMode]);

  /* =======================================================
     SAVE SETTINGS
  ======================================================= */

  const handleSave = () => {
    const settings: StoredSettings = {
      darkMode,
    };

    try {
      localStorage.setItem(
        SETTINGS_STORAGE_KEY,
        JSON.stringify(settings)
      );

      setSnackbarMessage(
        "Settings saved successfully!"
      );

      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch (error) {
      console.error(
        "Failed to save settings:",
        error
      );

      setSnackbarMessage(
        "Unable to save settings."
      );

      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  /* =======================================================
     MANAGE SECURITY

     Uses the existing password-reset flow.
  ======================================================= */

  const handleManageSecurity = async () => {
    const email = user?.email;

    if (!email) {
      setSnackbarMessage("Unable to identify your account email.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }

    try {
      const response = await api.post("/auth/forgot-password", {
        email,
      });

      if (response.data?.success) {
        setSnackbarMessage(
          "Password reset link generated successfully. Check your reset instructions."
        );
        setSnackbarSeverity("success");
      } else {
        setSnackbarMessage(
          response.data?.message || "Unable to start password reset."
        );
        setSnackbarSeverity("error");
      }
    } catch (error: any) {
      setSnackbarMessage(
        error?.response?.data?.message ||
          "Unable to manage account security."
      );
      setSnackbarSeverity("error");
    } finally {
      setSnackbarOpen(true);
    }
  };

  /* =======================================================
     CLOSE SNACKBAR
  ======================================================= */

  const handleSnackbarClose =
    () => {
      setSnackbarOpen(false);
    };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor:
          darkMode
            ? "#121A16"
            : "#F6F9F7",
        p: {
          xs: 2,
          sm: 3,
          md: 4,
        },
        transition:
          "background-color 0.25s ease",
      }}
    >
      {/* HEADER */}

      <Stack
        direction="row"
        alignItems="center"
        spacing={1.5}
        sx={{ mb: 1 }}
      >
        <IconButton
          onClick={() =>
            navigate("/dashboard")
          }
          sx={{
            width: 42,
            height: 42,
            borderRadius: 2,
            color: "#16804F",
            backgroundColor:
              darkMode
                ? "#1B2721"
                : "#FFFFFF",
            border:
              "1px solid #E1EBE5",

            "&:hover": {
              backgroundColor:
                "#EAF5EE",
            },
          }}
        >
          <ArrowBackIcon />
        </IconButton>

        <Box>
          <Typography
            sx={{
              fontSize: {
                xs: "1.65rem",
                sm: "2rem",
                md: "2.25rem",
              },
              fontWeight: 800,
              color: darkMode
                ? "#E8F1EC"
                : "#20332A",
              letterSpacing:
                "-0.7px",
            }}
          >
            Settings
          </Typography>

          <Typography
            sx={{
              mt: 0.4,
              fontSize: {
                xs: "0.85rem",
                sm: "0.95rem",
              },
              color: darkMode
                ? "#A7B5AD"
                : "#718078",
            }}
          >
            Manage your CarbonTrack
            preferences and account
            settings.
          </Typography>
        </Box>
      </Stack>

      <Box
        sx={{
          maxWidth: 1050,
          mx: "auto",
          mt: 4,
        }}
      >
        {/* APPEARANCE */}

        <Card
          elevation={0}
          sx={{
            mb: 2.5,
            borderRadius: 3,
            border:
              "1px solid #E1EBE5",
            backgroundColor:
              darkMode
                ? "#18221D"
                : "#FFFFFF",
          }}
        >
          <CardContent
            sx={{
              p: {
                xs: 2,
                sm: 3,
              },
            }}
          >
            <Stack
              direction="row"
              spacing={1.5}
              alignItems="center"
              sx={{ mb: 2.5 }}
            >
              <Box
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: 2,
                  display: "flex",
                  alignItems:
                    "center",
                  justifyContent:
                    "center",
                  backgroundColor:
                    "#F0ECF8",
                  color: "#7155A6",
                }}
              >
                <PaletteOutlinedIcon />
              </Box>

              <Box>
                <Typography
                  sx={{
                    fontSize:
                      "1.05rem",
                    fontWeight: 800,
                    color: darkMode
                      ? "#E8F1EC"
                      : "#20332A",
                  }}
                >
                  Appearance
                </Typography>

                <Typography
                  sx={{
                    fontSize:
                      "0.78rem",
                    color: darkMode
                      ? "#9EACA4"
                      : "#7A8981",
                  }}
                >
                  Customize your
                  application experience.
                </Typography>
              </Box>
            </Stack>

            <Divider sx={{ mb: 1 }} />

            <SettingRow
              title="Dark Mode"
              description="Use a darker interface for comfortable viewing."
              darkMode={darkMode}
              control={
                <Switch
                  checked={darkMode}
                  onChange={(e) =>
                    setDarkMode(
                      e.target.checked
                    )
                  }
                  sx={{
                    "& .MuiSwitch-switchBase.Mui-checked":
                      {
                        color:
                          "#16804F",
                      },
                    "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track":
                      {
                        backgroundColor:
                          "#16804F",
                      },
                  }}
                />
              }
            />

          </CardContent>
        </Card>

        {/* PROFILE */}

        <Card
          elevation={0}
          sx={{
            mb: 2.5,
            borderRadius: 3,
            border: "1px solid #E1EBE5",
            backgroundColor: darkMode ? "#18221D" : "#FFFFFF",
          }}
        >
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
              <Box
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#EAF5EE",
                  color: "#16804F",
                }}
              >
                <LockOutlinedIcon />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontSize: "1.05rem", fontWeight: 800, color: darkMode ? "#E8F1EC" : "#20332A" }}>
                  Profile & Account
                </Typography>
                <Typography sx={{ fontSize: "0.78rem", color: darkMode ? "#9EACA4" : "#7A8981" }}>
                  Update your personal information and profile appearance.
                </Typography>
              </Box>
              <Button
                variant="outlined"
                onClick={() => navigate("/profile")}
                sx={{
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 700,
                  color: "#16804F",
                  borderColor: "#C9DCD1",
                  "&:hover": { borderColor: "#16804F", backgroundColor: "#F1F8F4" },
                }}
              >
                Manage Profile
              </Button>
            </Stack>
          </CardContent>
        </Card>

        {/* SECURITY */}

        <Card
          elevation={0}
          sx={{
            mb: 2.5,
            borderRadius: 3,
            border:
              "1px solid #E1EBE5",
            backgroundColor:
              darkMode
                ? "#18221D"
                : "#FFFFFF",
          }}
        >
          <CardContent
            sx={{
              p: {
                xs: 2,
                sm: 3,
              },
            }}
          >
            <Stack
              direction="row"
              spacing={1.5}
              alignItems="center"
              sx={{ mb: 2.5 }}
            >
              <Box
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: 2,
                  display: "flex",
                  alignItems:
                    "center",
                  justifyContent:
                    "center",
                  backgroundColor:
                    "#FFF5DD",
                  color: "#B47700",
                }}
              >
                <SecurityOutlinedIcon />
              </Box>

              <Box>
                <Typography
                  sx={{
                    fontSize:
                      "1.05rem",
                    fontWeight: 800,
                    color: darkMode
                      ? "#E8F1EC"
                      : "#20332A",
                  }}
                >
                  Security
                </Typography>

                <Typography
                  sx={{
                    fontSize:
                      "0.78rem",
                    color: darkMode
                      ? "#9EACA4"
                      : "#7A8981",
                  }}
                >
                  Keep your CarbonTrack
                  account secure.
                </Typography>
              </Box>
            </Stack>

            <Divider sx={{ mb: 2 }} />

            <Stack
              direction={{
                xs: "column",
                sm: "row",
              }}
              justifyContent="space-between"
              alignItems={{
                xs: "flex-start",
                sm: "center",
              }}
              spacing={2}
            >
              <Box>
                <Typography
                  sx={{
                    fontSize:
                      "0.9rem",
                    fontWeight: 700,
                    color: darkMode
                      ? "#DCE8E1"
                      : "#25372E",
                  }}
                >
                  Password & Account Security
                </Typography>

                <Typography
                  sx={{
                    mt: 0.3,
                    fontSize:
                      "0.75rem",
                    color: darkMode
                      ? "#98A79F"
                      : "#849189",
                  }}
                >
                  Manage your password
                  and account protection.
                </Typography>
              </Box>

              <Button
                variant="outlined"
                startIcon={
                  <LockOutlinedIcon />
                }
                onClick={
                  handleManageSecurity
                }
                sx={{
                  borderRadius: 2,
                  px: 2.2,
                  textTransform:
                    "none",
                  fontWeight: 700,
                  color: "#16804F",
                  borderColor:
                    "#C9DCD1",

                  "&:hover": {
                    borderColor:
                      "#16804F",
                    backgroundColor:
                      "#F1F8F4",
                  },
                }}
              >
                Manage Security
              </Button>
            </Stack>
          </CardContent>
        </Card>

        {/* SAVE */}

        <Stack
          direction="row"
          justifyContent="flex-end"
          sx={{
            mt: 3,
            mb: 2,
          }}
        >
          <Button
            variant="contained"
            startIcon={
              <SaveOutlinedIcon />
            }
            onClick={handleSave}
            disableElevation
            sx={{
              minWidth: 150,
              py: 1.2,
              px: 2.5,
              borderRadius: 2,
              textTransform:
                "none",
              fontWeight: 800,
              background:
                "linear-gradient(135deg, #146B43 0%, #1B8A5A 100%)",
              boxShadow:
                "0 6px 16px rgba(22,128,79,0.18)",

              "&:hover": {
                background:
                  "linear-gradient(135deg, #126B42 0%, #16804F 100%)",
                boxShadow:
                  "0 8px 20px rgba(22,128,79,0.25)",
                transform:
                  "translateY(-1px)",
              },

              transition:
                "all 0.2s ease",
            }}
          >
            Save Settings
          </Button>
        </Stack>

        {/* FOOTER */}

        <Box
          sx={{
            py: 2,
            textAlign: "center",
          }}
        >
          <Typography
            sx={{
              fontSize:
                "0.72rem",
              color: darkMode
                ? "#738078"
                : "#96A39C",
            }}
          >
            CarbonTrack • Sustainability Analytics Platform
          </Typography>
        </Box>
      </Box>

      {/* SUCCESS / ERROR MESSAGE */}

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={
          handleSnackbarClose
        }
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
      >
        <Alert
          onClose={
            handleSnackbarClose
          }
          severity={
            snackbarSeverity
          }
          variant="filled"
          sx={{
            borderRadius: 2,
            fontWeight: 600,
          }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

/* =========================================================
   REUSABLE SETTING ROW
========================================================= */

interface SettingRowProps {
  title: string;
  description: string;
  control: ReactNode;
  darkMode: boolean;
}

const SettingRow = ({
  title,
  description,
  control,
  darkMode,
}: SettingRowProps) => {
  return (
    <Box
      sx={{
        py: 1.8,
        display: "flex",
        alignItems: "center",
        justifyContent:
          "space-between",
        gap: 2,
        borderBottom:
          "1px solid #EEF3F0",

        "&:last-child": {
          borderBottom: "none",
        },
      }}
    >
      <Box
        sx={{
          minWidth: 0,
        }}
      >
        <Typography
          sx={{
            fontSize:
              "0.9rem",
            fontWeight: 700,
            color: darkMode
              ? "#DCE8E1"
              : "#25372E",
          }}
        >
          {title}
        </Typography>

        <Typography
          sx={{
            mt: 0.3,
            fontSize:
              "0.75rem",
            color: darkMode
              ? "#98A79F"
              : "#849189",
            lineHeight: 1.5,
          }}
        >
          {description}
        </Typography>
      </Box>

      {control}
    </Box>
  );
};

export default Settings;