
import { useEffect, useMemo, useState } from "react";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import DevicesOutlinedIcon from "@mui/icons-material/DevicesOutlined";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import ElectricBoltOutlinedIcon from "@mui/icons-material/ElectricBoltOutlined";
import CloudDoneOutlinedIcon from "@mui/icons-material/CloudDoneOutlined";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import WifiOutlinedIcon from "@mui/icons-material/WifiOutlined";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import SyncOutlinedIcon from "@mui/icons-material/SyncOutlined";
import PowerSettingsNewOutlinedIcon from "@mui/icons-material/PowerSettingsNewOutlined";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CloudOutlinedIcon from "@mui/icons-material/CloudOutlined";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

import api from "../services/api";

interface Device {
  _id: string;
  name: string;
  type: string;
  location?: string;
  status: "connected" | "offline";
  lastSync?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface DeviceForm {
  name: string;
  type: string;
  location: string;
}

const EMPTY_FORM: DeviceForm = {
  name: "",
  type: "",
  location: "",
};

const MyDevices = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<DeviceForm>(EMPTY_FORM);

  /* =====================================================
     LOAD DEVICES
  ===================================================== */

  const loadDevices = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/devices");

      const fetchedDevices = response.data?.data?.devices;

      setDevices(
        Array.isArray(fetchedDevices) ? fetchedDevices : []
      );
    } catch (err: any) {
      console.error("Load devices error:", err);

      setError(
        err?.response?.data?.message ||
          "Unable to load devices."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDevices();
  }, []);

  /* =====================================================
     SUMMARY
  ===================================================== */

  const totalDevices = devices.length;

  const activeDevices = devices.filter(
    (device) => device.status === "connected"
  ).length;

  const latestSync = useMemo(() => {
    const syncedDevices = devices.filter(
      (device) => device.lastSync
    );

    if (syncedDevices.length === 0) {
      return null;
    }

    return syncedDevices.sort(
      (a, b) =>
        new Date(b.lastSync as string).getTime() -
        new Date(a.lastSync as string).getTime()
    )[0].lastSync;
  }, [devices]);

  /* =====================================================
     DIALOG
  ===================================================== */

  const openAddDialog = () => {
    setForm(EMPTY_FORM);
    setError("");
    setSuccess("");
    setDialogOpen(true);
  };

  const closeAddDialog = () => {
    if (saving) return;

    setDialogOpen(false);
    setForm(EMPTY_FORM);
  };

  /* =====================================================
     FORM
  ===================================================== */

  const handleFormChange = (
    field: keyof DeviceForm,
    value: string
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  /* =====================================================
     CREATE DEVICE
  ===================================================== */

  const handleAddDevice = async () => {
    if (!form.name.trim()) {
      setError("Please enter a device name.");
      return;
    }

    if (!form.type.trim()) {
      setError("Please select a device type.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response = await api.post("/devices", {
        name: form.name.trim(),
        type: form.type.trim(),
        location: form.location.trim(),
      });

      const newDevice = response.data?.data?.device;

      if (newDevice) {
        setDevices((prev) => [newDevice, ...prev]);
      } else {
        await loadDevices();
      }

      setDialogOpen(false);
      setForm(EMPTY_FORM);

      setSuccess("Device connected successfully.");

      window.setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (err: any) {
      console.error("Add device error:", err);

      setError(
        err?.response?.data?.message ||
          "Unable to connect device."
      );
    } finally {
      setSaving(false);
    }
  };

  /* =====================================================
     DELETE DEVICE
  ===================================================== */

  const handleDelete = async (deviceId: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to remove this device?"
    );

    if (!confirmed) return;

    try {
      setError("");

      await api.delete(`/devices/${deviceId}`);

      setDevices((prev) =>
        prev.filter((device) => device._id !== deviceId)
      );

      setSuccess("Device removed successfully.");

      window.setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (err: any) {
      console.error("Delete device error:", err);

      setError(
        err?.response?.data?.message ||
          "Unable to remove device."
      );
    }
  };

  /* =====================================================
     TOGGLE STATUS
  ===================================================== */

  const handleToggleStatus = async (device: Device) => {
    const nextStatus =
      device.status === "connected"
        ? "offline"
        : "connected";

    try {
      setError("");

      const response = await api.put(
        `/devices/${device._id}`,
        {
          status: nextStatus,
        }
      );

      const updatedDevice = response.data?.data?.device;

      if (updatedDevice) {
        setDevices((prev) =>
          prev.map((item) =>
            item._id === device._id
              ? updatedDevice
              : item
          )
        );
      }
    } catch (err: any) {
      console.error("Update device error:", err);

      setError(
        err?.response?.data?.message ||
          "Unable to update device."
      );
    }
  };

  /* =====================================================
     SYNC
  ===================================================== */

  const handleSync = async (deviceId: string) => {
    try {
      setError("");

      const response = await api.post(
        `/devices/${deviceId}/sync`
      );

      const updatedDevice = response.data?.data?.device;

      if (updatedDevice) {
        setDevices((prev) =>
          prev.map((device) =>
            device._id === deviceId
              ? updatedDevice
              : device
          )
        );
      }

      setSuccess("Device synced successfully.");

      window.setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (err: any) {
      console.error("Sync device error:", err);

      setError(
        err?.response?.data?.message ||
          "Unable to sync device."
      );
    }
  };

  /* =====================================================
     DATE FORMAT
  ===================================================== */

  const formatSyncDate = (value?: string | null) => {
    if (!value) {
      return "No sync activity";
    }

    return new Date(value).toLocaleString([], {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100%",
        maxWidth: "100%",
        overflowX: "hidden",
        boxSizing: "border-box",
        background:
          "linear-gradient(180deg, #F8FBF9 0%, #F4F8F5 50%, #F1F6F3 100%)",
        px: {
          xs: 1.25,
          sm: 2.5,
          md: 3,
          lg: 4,
        },
        py: {
          xs: 2,
          sm: 2.5,
          md: 3.5,
        },
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 1320,
          mx: "auto",
          minWidth: 0,
        }}
      >
        {/* =================================================
            HEADER
        ================================================= */}

        <Box
          sx={{
            mb: {
              xs: 2.5,
              md: 3.5,
            },
            display: "flex",
            alignItems: {
              xs: "stretch",
              sm: "center",
            },
            justifyContent: "space-between",
            flexDirection: {
              xs: "column",
              sm: "row",
            },
            gap: 2.5,
          }}
        >
          <Box
            sx={{
              minWidth: 0,
              width: {
                xs: "100%",
                sm: "auto",
              },
            }}
          >
            <Stack
              direction="row"
              spacing={1}
              sx={{
                alignItems: "center",
                mb: 0.9,
              }}
            >
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  flexShrink: 0,
                  borderRadius: "50%",
                  background:
                    "linear-gradient(135deg, #1C9B61, #087340)",
                  boxShadow:
                    "0 0 0 5px rgba(22,128,79,0.09)",
                }}
              />

              <Typography
                sx={{
                  fontSize: 10.5,
                  fontWeight: 900,
                  letterSpacing: 1.35,
                  textTransform: "uppercase",
                  color: "#16804F",
                }}
              >
                Device Management
              </Typography>
            </Stack>

            <Typography
              sx={{
                fontSize: {
                  xs: 28,
                  sm: 31,
                  md: 35,
                },
                lineHeight: 1.1,
                fontWeight: 900,
                letterSpacing: "-1.3px",
                color: "#14231B",
                overflowWrap: "break-word",
              }}
            >
              My Devices
            </Typography>

            <Typography
              sx={{
                mt: 0.8,
                maxWidth: 610,
                fontSize: {
                  xs: 12.5,
                  sm: 13.5,
                },
                lineHeight: 1.7,
                color: "#6D7B73",
              }}
            >
              Manage your connected sustainability devices,
              monitor their status, and keep your environmental
              data synchronized.
            </Typography>
          </Box>

          <Button
            variant="contained"
            startIcon={<AddOutlinedIcon />}
            onClick={openAddDialog}
            sx={{
              minHeight: 47,
              px: 2.5,
              width: {
                xs: "100%",
                sm: "auto",
              },
              flexShrink: 0,
              borderRadius: "13px",
              textTransform: "none",
              fontSize: 13,
              fontWeight: 850,
              letterSpacing: 0.1,
              background:
                "linear-gradient(135deg, #168A52 0%, #08763E 100%)",
              boxShadow:
                "0 10px 25px rgba(22,138,82,0.20)",
              transition: "all .2s ease",
              "&:hover": {
                background:
                  "linear-gradient(135deg, #0F7545 0%, #075E32 100%)",
                transform: "translateY(-1px)",
                boxShadow:
                  "0 14px 30px rgba(22,138,82,0.25)",
              },
            }}
          >
            Add Device
          </Button>
        </Box>

        {/* =================================================
            ALERTS
        ================================================= */}

        {error && (
          <Alert
            severity="error"
            onClose={() => setError("")}
            sx={{
              mb: 2,
              borderRadius: "13px",
              border: "1px solid #F0D0D0",
              backgroundColor: "#FFF9F9",
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            {error}
          </Alert>
        )}

        {success && (
          <Alert
            severity="success"
            onClose={() => setSuccess("")}
            sx={{
              mb: 2,
              borderRadius: "13px",
              border: "1px solid #CFE8D9",
              backgroundColor: "#F7FCF8",
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            {success}
          </Alert>
        )}

        {/* =================================================
            SMART BANNER
        ================================================= */}

        <Card
          elevation={0}
          sx={{
            mb: 2.5,
            borderRadius: "20px",
            border: "1px solid #D8EADF",
            background:
              "linear-gradient(135deg, #F0FAF4 0%, #E7F6ED 100%)",
            boxShadow:
              "0 8px 28px rgba(22,128,79,0.045)",
            overflow: "hidden",
            position: "relative",
          }}
        >
          <Box
            sx={{
              position: "absolute",
              width: 180,
              height: 180,
              borderRadius: "50%",
              background:
                "rgba(22,128,79,0.055)",
              right: -70,
              top: -90,
            }}
          />

          <CardContent
            sx={{
              p: {
                xs: 2,
                sm: 2.5,
                md: 2.7,
              },
              "&:last-child": {
                pb: {
                  xs: 2,
                  sm: 2.5,
                  md: 2.7,
                },
              },
            }}
          >
            <Stack
              direction={{
                xs: "column",
                sm: "row",
              }}
              spacing={2}
              sx={{
                position: "relative",
                alignItems: {
                  xs: "flex-start",
                  sm: "center",
                },
                justifyContent: "space-between",
                minWidth: 0,
              }}
            >
              <Stack
                direction="row"
                spacing={1.4}
                sx={{
                  alignItems: "center",
                  minWidth: 0,
                  width: {
                    xs: "100%",
                    sm: "auto",
                  },
                }}
              >
                <Box
                  sx={{
                    width: 46,
                    height: 46,
                    minWidth: 46,
                    borderRadius: "14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#16804F",
                    background:
                      "rgba(255,255,255,0.82)",
                    border:
                      "1px solid rgba(216,234,223,0.95)",
                    boxShadow:
                      "0 6px 18px rgba(22,128,79,0.07)",
                  }}
                >
                  <AutoAwesomeOutlinedIcon />
                </Box>

                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    sx={{
                      fontSize: 13,
                      fontWeight: 850,
                      color: "#173628",
                    }}
                  >
                    Smart sustainability tracking
                  </Typography>

                  <Typography
                    sx={{
                      mt: 0.35,
                      fontSize: 11.5,
                      color: "#688075",
                      lineHeight: 1.55,
                    }}
                  >
                    Connect compatible devices to simplify
                    your carbon tracking.
                  </Typography>
                </Box>
              </Stack>

              <Chip
                icon={
                  <WifiOutlinedIcon
                    sx={{
                      fontSize:
                        "15px !important",
                    }}
                  />
                }
                label={
                  activeDevices > 0
                    ? `${activeDevices} Active`
                    : "Ready to connect"
                }
                sx={{
                  height: 31,
                  maxWidth: "100%",
                  borderRadius: "10px",
                  backgroundColor:
                    "rgba(255,255,255,0.88)",
                  color: "#16804F",
                  border:
                    "1px solid #D2E8DA",
                  fontSize: 10.5,
                  fontWeight: 850,
                  "& .MuiChip-icon": {
                    color: "#16804F",
                  },
                }}
              />
            </Stack>
          </CardContent>
        </Card>

        {/* =================================================
            SUMMARY CARDS
        ================================================= */}

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, minmax(0, 1fr))",
              lg: "repeat(3, minmax(0, 1fr))",
            },
            gap: 1.8,
            mb: 2.5,
          }}
        >
          <SummaryCard
            icon={<DevicesOutlinedIcon />}
            title="Total Devices"
            value={String(totalDevices)}
            subtitle={
              totalDevices === 0
                ? "No devices connected"
                : `${totalDevices} device${
                    totalDevices > 1 ? "s" : ""
                  } registered`
            }
            iconBg="#E8F7EE"
            iconColor="#16804F"
            accent="#16804F"
          />

          <SummaryCard
            icon={<ElectricBoltOutlinedIcon />}
            title="Active Devices"
            value={String(activeDevices)}
            subtitle="Currently connected"
            iconBg="#FFF5E5"
            iconColor="#E58A00"
            accent="#E58A00"
          />

          <SummaryCard
            icon={<CloudDoneOutlinedIcon />}
            title="Last Sync"
            value={
              latestSync
                ? new Date(
                    latestSync
                  ).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "—"
            }
            subtitle={
              latestSync
                ? formatSyncDate(latestSync)
                : "No sync activity"
            }
            iconBg="#EAF2FF"
            iconColor="#2878D8"
            accent="#2878D8"
          />
        </Box>

        {/* =================================================
            DEVICE CONTAINER
        ================================================= */}

        <Card
          elevation={0}
          sx={{
            width: "100%",
            maxWidth: "100%",
            minWidth: 0,
            borderRadius: "22px",
            border: "1px solid #E0E8E3",
            backgroundColor: "#FFFFFF",
            boxShadow:
              "0 12px 40px rgba(20,50,35,0.055)",
            overflow: "hidden",
          }}
        >
          <CardContent
            sx={{
              p: {
                xs: 1.7,
                sm: 2.5,
                md: 3,
              },
              minWidth: 0,
              "&:last-child": {
                pb: {
                  xs: 1.7,
                  sm: 2.5,
                  md: 3,
                },
              },
            }}
          >
            {/* SECTION HEADER */}

            <Stack
              direction={{
                xs: "column",
                sm: "row",
              }}
              spacing={1.5}
              sx={{
                alignItems: {
                  xs: "flex-start",
                  sm: "center",
                },
                justifyContent: "space-between",
                minWidth: 0,
              }}
            >
              <Stack
                direction="row"
                spacing={1.3}
                sx={{
                  alignItems: "center",
                  minWidth: 0,
                  width: {
                    xs: "100%",
                    sm: "auto",
                  },
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
                    background:
                      "linear-gradient(135deg, #E9F8EF 0%, #DDF2E7 100%)",
                    color: "#16804F",
                    border:
                      "1px solid #D7EBDD",
                  }}
                >
                  <DevicesOutlinedIcon />
                </Box>

                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    sx={{
                      fontSize: 17,
                      fontWeight: 900,
                      letterSpacing: "-0.2px",
                      color: "#17221C",
                    }}
                  >
                    Connected Devices
                  </Typography>

                  <Typography
                    sx={{
                      mt: 0.25,
                      fontSize: 11.5,
                      color: "#78857E",
                    }}
                  >
                    Monitor and manage your sustainability
                    devices.
                  </Typography>
                </Box>
              </Stack>

              <Chip
                icon={
                  <DevicesOutlinedIcon
                    sx={{
                      fontSize:
                        "14px !important",
                    }}
                  />
                }
                label={`${totalDevices} ${
                  totalDevices === 1
                    ? "Device"
                    : "Devices"
                }`}
                sx={{
                  height: 30,
                  maxWidth: "100%",
                  borderRadius: "10px",
                  backgroundColor: "#F5F8F6",
                  border: "1px solid #E4EBE7",
                  color: "#66746C",
                  fontSize: 10.5,
                  fontWeight: 850,
                  "& .MuiChip-icon": {
                    color: "#7C8A82",
                  },
                }}
              />
            </Stack>

            <Divider
              sx={{
                my: 2.5,
                borderColor: "#EDF1EE",
              }}
            />

            {/* =================================================
                LOADING
            ================================================= */}

            {loading && (
              <Box
                sx={{
                  minHeight: 300,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Box
                  sx={{
                    width: 60,
                    height: 60,
                    borderRadius: "18px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#EEF8F2",
                    mb: 1.5,
                  }}
                >
                  <CircularProgress
                    size={28}
                    thickness={4}
                    sx={{
                      color: "#16804F",
                    }}
                  />
                </Box>

                <Typography
                  sx={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#738079",
                  }}
                >
                  Loading your devices...
                </Typography>
              </Box>
            )}

            {/* =================================================
                EMPTY STATE
            ================================================= */}

            {!loading && devices.length === 0 && (
              <Box
                sx={{
                  minHeight: 350,
                  width: "100%",
                  boxSizing: "border-box",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  px: {
                    xs: 1.5,
                    sm: 3,
                  },
                  borderRadius: "18px",
                  background:
                    "radial-gradient(circle at 50% 35%, rgba(22,128,79,0.07), transparent 34%), #FBFDFC",
                  border: "1px solid #EEF2EF",
                }}
              >
                <Box
                  sx={{
                    position: "relative",
                    width: 88,
                    height: 88,
                    minWidth: 88,
                    borderRadius: "26px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mb: 2.2,
                    background:
                      "linear-gradient(145deg, #E9F8EF 0%, #DDF2E7 100%)",
                    color: "#16804F",
                    border: "1px solid #D6EBDD",
                    boxShadow:
                      "0 14px 30px rgba(22,128,79,0.10)",
                  }}
                >
                  <DevicesOutlinedIcon
                    sx={{
                      fontSize: 42,
                    }}
                  />

                  <Box
                    sx={{
                      position: "absolute",
                      right: -5,
                      bottom: -4,
                      width: 27,
                      height: 27,
                      borderRadius: "9px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "#FFFFFF",
                      border: "1px solid #DCEBE1",
                      color: "#16804F",
                      boxShadow:
                        "0 5px 14px rgba(20,50,35,0.08)",
                    }}
                  >
                    <AddOutlinedIcon
                      sx={{
                        fontSize: 16,
                      }}
                    />
                  </Box>
                </Box>

                <Typography
                  sx={{
                    fontSize: {
                      xs: 19,
                      sm: 21,
                    },
                    fontWeight: 900,
                    letterSpacing: "-0.3px",
                    color: "#17221C",
                  }}
                >
                  No devices connected
                </Typography>

                <Typography
                  sx={{
                    width: "100%",
                    maxWidth: 510,
                    mt: 0.8,
                    fontSize: 12.5,
                    lineHeight: 1.75,
                    color: "#748179",
                  }}
                >
                  Connect a compatible device to automatically
                  track your sustainability data and keep your
                  carbon footprint updated.
                </Typography>

                <Button
                  variant="contained"
                  startIcon={<AddOutlinedIcon />}
                  endIcon={<ArrowForwardRoundedIcon />}
                  onClick={openAddDialog}
                  sx={{
                    mt: 2.5,
                    minHeight: 44,
                    maxWidth: "100%",
                    px: 2.4,
                    borderRadius: "12px",
                    textTransform: "none",
                    fontSize: 12.5,
                    fontWeight: 850,
                    background:
                      "linear-gradient(135deg, #168A52 0%, #08763E 100%)",
                    boxShadow:
                      "0 9px 22px rgba(22,138,82,0.18)",
                    "&:hover": {
                      background:
                        "linear-gradient(135deg, #0F7545 0%, #075E32 100%)",
                      transform: "translateY(-1px)",
                    },
                  }}
                >
                  Connect Your First Device
                </Button>
              </Box>
            )}

            {/* =================================================
                DEVICE LIST
            ================================================= */}

            {!loading && devices.length > 0 && (
              <Stack spacing={1.4}>
                {devices.map((device) => (
                  <Card
                    key={device._id}
                    elevation={0}
                    sx={{
                      width: "100%",
                      minWidth: 0,
                      border:
                        "1px solid #E4ECE7",
                      borderRadius: "17px",
                      background:
                        "linear-gradient(180deg, #FFFFFF 0%, #FBFDFC 100%)",
                      transition:
                        "all .2s ease",
                      "&:hover": {
                        borderColor:
                          "#CFE2D7",
                        boxShadow:
                          "0 10px 28px rgba(20,50,35,0.065)",
                        transform:
                          "translateY(-1px)",
                      },
                    }}
                  >
                    <CardContent
                      sx={{
                        p: {
                          xs: 1.5,
                          sm: 1.8,
                          md: 2,
                        },
                        minWidth: 0,
                        "&:last-child": {
                          pb: {
                            xs: 1.5,
                            sm: 1.8,
                            md: 2,
                          },
                        },
                      }}
                    >
                      <Stack
                        direction={{
                          xs: "column",
                          md: "row",
                        }}
                        spacing={{
                          xs: 1.6,
                          md: 2,
                        }}
                        sx={{
                          alignItems: {
                            xs: "stretch",
                            md: "center",
                          },
                          justifyContent:
                            "space-between",
                          minWidth: 0,
                        }}
                      >
                        {/* DEVICE INFO */}

                        <Stack
                          direction="row"
                          spacing={1.4}
                          sx={{
                            alignItems:
                              "center",
                            minWidth: 0,
                            flex: 1,
                            width: {
                              xs: "100%",
                              md: "auto",
                            },
                          }}
                        >
                          <Box
                            sx={{
                              width: {
                                xs: 46,
                                sm: 50,
                              },
                              height: {
                                xs: 46,
                                sm: 50,
                              },
                              minWidth: {
                                xs: 46,
                                sm: 50,
                              },
                              borderRadius:
                                "15px",
                              display:
                                "flex",
                              alignItems:
                                "center",
                              justifyContent:
                                "center",
                              background:
                                "linear-gradient(145deg, #EAF8F0 0%, #DFF3E8 100%)",
                              color:
                                "#16804F",
                              border:
                                "1px solid #D6EBDD",
                            }}
                          >
                            <DevicesOutlinedIcon />
                          </Box>

                          <Box
                            sx={{
                              minWidth: 0,
                              flex: 1,
                              overflow: "hidden",
                            }}
                          >
                            <Stack
                              direction="row"
                              spacing={0.8}
                              sx={{
                                alignItems:
                                  "center",
                                flexWrap:
                                  "wrap",
                                rowGap:
                                  0.5,
                                minWidth: 0,
                              }}
                            >
                              <Typography
                                sx={{
                                  fontSize: {
                                    xs: 13.5,
                                    sm: 14.5,
                                  },
                                  fontWeight:
                                    850,
                                  color:
                                    "#17221C",
                                  overflow:
                                    "hidden",
                                  textOverflow:
                                    "ellipsis",
                                  whiteSpace:
                                    "nowrap",
                                  minWidth: 0,
                                  maxWidth:
                                    {
                                      xs: "100%",
                                      sm: 280,
                                      md: 320,
                                    },
                                }}
                              >
                                {device.name}
                              </Typography>

                              <Chip
                                icon={
                                  device.status ===
                                  "connected" ? (
                                    <CheckCircleRoundedIcon
                                      sx={{
                                        fontSize:
                                          "13px !important",
                                      }}
                                    />
                                  ) : undefined
                                }
                                label={
                                  device.status ===
                                  "connected"
                                    ? "Connected"
                                    : "Offline"
                                }
                                size="small"
                                sx={{
                                  height: 23,
                                  maxWidth: "100%",
                                  borderRadius:
                                    "7px",
                                  fontSize:
                                    9.5,
                                  fontWeight:
                                    850,
                                  color:
                                    device.status ===
                                    "connected"
                                      ? "#137747"
                                      : "#8A6A00",
                                  backgroundColor:
                                    device.status ===
                                    "connected"
                                      ? "#EAF8F0"
                                      : "#FFF6D9",
                                  border:
                                    "1px solid",
                                  borderColor:
                                    device.status ===
                                    "connected"
                                      ? "#D3ECDD"
                                      : "#F1E5B9",
                                  "& .MuiChip-icon":
                                    {
                                      color:
                                        "#16804F",
                                    },
                                }}
                              />
                            </Stack>

                            <Stack
                              direction="row"
                              spacing={1}
                              sx={{
                                mt: 0.55,
                                alignItems:
                                  "center",
                                flexWrap:
                                  "wrap",
                                rowGap:
                                  0.4,
                                minWidth: 0,
                              }}
                            >
                              <Typography
                                sx={{
                                  fontSize:
                                    10.8,
                                  fontWeight:
                                    650,
                                  color:
                                    "#68766E",
                                  maxWidth:
                                    "100%",
                                  overflow:
                                    "hidden",
                                  textOverflow:
                                    "ellipsis",
                                  whiteSpace:
                                    "nowrap",
                                }}
                              >
                                {device.type}
                              </Typography>

                              {device.location && (
                                <>
                                  <Box
                                    sx={{
                                      width: 3,
                                      height: 3,
                                      minWidth: 3,
                                      borderRadius:
                                        "50%",
                                      backgroundColor:
                                        "#B6C0BA",
                                    }}
                                  />

                                  <Stack
                                    direction="row"
                                    spacing={0.35}
                                    sx={{
                                      alignItems:
                                        "center",
                                      minWidth: 0,
                                      maxWidth:
                                        "100%",
                                    }}
                                  >
                                    <LocationOnOutlinedIcon
                                      sx={{
                                        fontSize: 13,
                                        color:
                                          "#8A9790",
                                        flexShrink: 0,
                                      }}
                                    />

                                    <Typography
                                      sx={{
                                        fontSize:
                                          10.8,
                                        color:
                                          "#7B887F",
                                        overflow:
                                          "hidden",
                                        textOverflow:
                                          "ellipsis",
                                        whiteSpace:
                                          "nowrap",
                                      }}
                                    >
                                      {
                                        device.location
                                      }
                                    </Typography>
                                  </Stack>
                                </>
                              )}
                            </Stack>

                            <Stack
                              direction="row"
                              spacing={0.45}
                              sx={{
                                mt: 0.45,
                                alignItems:
                                  "center",
                                minWidth: 0,
                              }}
                            >
                              <AccessTimeOutlinedIcon
                                sx={{
                                  fontSize: 12.5,
                                  color:
                                    "#A0AAA4",
                                  flexShrink: 0,
                                }}
                              />

                              <Typography
                                sx={{
                                  fontSize:
                                    10.2,
                                  color:
                                    "#929D96",
                                  overflow:
                                    "hidden",
                                  textOverflow:
                                    "ellipsis",
                                  whiteSpace:
                                    {
                                      xs: "normal",
                                      sm: "nowrap",
                                    },
                                }}
                              >
                                Last sync:{" "}
                                {formatSyncDate(
                                  device.lastSync
                                )}
                              </Typography>
                            </Stack>
                          </Box>
                        </Stack>

                        {/* ACTIONS */}

                        <Stack
                          direction="row"
                          spacing={0.7}
                          sx={{
                            alignItems:
                              "center",
                            justifyContent: {
                              xs: "flex-end",
                              md: "initial",
                            },
                            width: {
                              xs: "100%",
                              md: "auto",
                            },
                            flexWrap: {
                              xs: "wrap",
                              sm: "nowrap",
                            },
                            minWidth: 0,
                          }}
                        >
                          <Button
                            size="small"
                            startIcon={
                              <SyncOutlinedIcon
                                sx={{
                                  fontSize:
                                    "17px !important",
                                }}
                              />
                            }
                            onClick={() =>
                              handleSync(
                                device._id
                              )
                            }
                            sx={{
                              minHeight: 36,
                              px: 1.4,
                              borderRadius:
                                "10px",
                              textTransform:
                                "none",
                              color:
                                "#16804F",
                              backgroundColor:
                                "#F1F9F4",
                              border:
                                "1px solid #DCEDE3",
                              fontSize: 11.5,
                              fontWeight:
                                800,
                              flexShrink: 0,
                              "&:hover": {
                                backgroundColor:
                                  "#E7F5ED",
                                borderColor:
                                  "#C9E2D4",
                              },
                            }}
                          >
                            Sync
                          </Button>

                          <Button
                            size="small"
                            startIcon={
                              <PowerSettingsNewOutlinedIcon
                                sx={{
                                  fontSize:
                                    "17px !important",
                                }}
                              />
                            }
                            onClick={() =>
                              handleToggleStatus(
                                device
                              )
                            }
                            sx={{
                              minHeight: 36,
                              px: 1.35,
                              borderRadius:
                                "10px",
                              textTransform:
                                "none",
                              color:
                                "#69776F",
                              backgroundColor:
                                "#F7F9F8",
                              border:
                                "1px solid #E5EAE7",
                              fontSize: 11.5,
                              fontWeight:
                                800,
                              flexShrink: 0,
                              "&:hover": {
                                backgroundColor:
                                  "#F0F4F2",
                                borderColor:
                                  "#D9E1DC",
                              },
                            }}
                          >
                            {device.status ===
                            "connected"
                              ? "Disable"
                              : "Enable"}
                          </Button>

                          <IconButton
                            aria-label="Delete device"
                            onClick={() =>
                              handleDelete(
                                device._id
                              )
                            }
                            sx={{
                              width: 36,
                              height: 36,
                              minWidth: 36,
                              borderRadius:
                                "10px",
                              color:
                                "#D04C4C",
                              backgroundColor:
                                "#FFF7F7",
                              border:
                                "1px solid #F1DEDE",
                              flexShrink: 0,
                              "&:hover": {
                                backgroundColor:
                                  "#FDEEEE",
                                borderColor:
                                  "#EBCACA",
                              },
                            }}
                          >
                            <DeleteOutlineOutlinedIcon
                              sx={{
                                fontSize: 19,
                              }}
                            />
                          </IconButton>
                        </Stack>
                      </Stack>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            )}
          </CardContent>
        </Card>

        {/* =================================================
            FOOTER
        ================================================= */}

        <Stack
          direction="row"
          spacing={0.8}
          sx={{
            mt: 2.2,
            justifyContent: "center",
            alignItems: "center",
            px: 1,
            maxWidth: "100%",
          }}
        >
          <CloudOutlinedIcon
            sx={{
              fontSize: 16,
              color: "#A0ABA4",
              flexShrink: 0,
            }}
          />

          <Typography
            sx={{
              fontSize: 10.5,
              color: "#9BA59F",
              textAlign: "center",
            }}
          >
            Connected devices help keep your sustainability
            data accurate and up to date.
          </Typography>
        </Stack>
      </Box>

      {/* =====================================================
          ADD DEVICE DIALOG
      ===================================================== */}

      <Dialog
        open={dialogOpen}
        onClose={closeAddDialog}
        fullWidth
        maxWidth="sm"
        slotProps={{
          paper: {
            sx: {
              width: {
                xs: "calc(100% - 24px)",
                sm: "100%",
              },
              maxWidth: "100%",
              borderRadius: "22px",
              border: "1px solid #E1E9E4",
              boxShadow:
                "0 24px 70px rgba(20,50,35,0.16)",
              overflow: "hidden",
              mx: {
                xs: 1.5,
                sm: 2,
              },
            },
          },
        }}
      >
        <DialogTitle
          sx={{
            px: {
              xs: 2,
              sm: 3,
            },
            pt: {
              xs: 2.2,
              sm: 3,
            },
            pb: 1.5,
          }}
        >
          <Stack
            direction="row"
            spacing={1.4}
            sx={{
              alignItems: "center",
              justifyContent:
                "space-between",
              minWidth: 0,
            }}
          >
            <Stack
              direction="row"
              spacing={1.3}
              sx={{
                alignItems: "center",
                minWidth: 0,
                flex: 1,
              }}
            >
              <Box
                sx={{
                  width: 46,
                  height: 46,
                  minWidth: 46,
                  borderRadius: "14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#16804F",
                  background:
                    "linear-gradient(145deg, #EAF8F0, #DDF2E7)",
                  border:
                    "1px solid #D5EBDD",
                }}
              >
                <DevicesOutlinedIcon />
              </Box>

              <Box sx={{ minWidth: 0 }}>
                <Typography
                  sx={{
                    fontSize: {
                      xs: 16,
                      sm: 18,
                    },
                    fontWeight: 900,
                    color: "#17221C",
                    overflowWrap: "break-word",
                  }}
                >
                  Connect New Device
                </Typography>

                <Typography
                  sx={{
                    mt: 0.25,
                    fontSize: 11.5,
                    color: "#7A867F",
                  }}
                >
                  Add a device to your sustainability
                  dashboard.
                </Typography>
              </Box>
            </Stack>

            <IconButton
              onClick={closeAddDialog}
              disabled={saving}
              sx={{
                width: 34,
                height: 34,
                minWidth: 34,
                borderRadius: "10px",
                color: "#7B877F",
                backgroundColor: "#F5F8F6",
                flexShrink: 0,
                "&:hover": {
                  backgroundColor: "#EDF3EF",
                },
              }}
            >
              <CloseRoundedIcon
                sx={{
                  fontSize: 19,
                }}
              />
            </IconButton>
          </Stack>
        </DialogTitle>

        <DialogContent
          sx={{
            px: {
              xs: 2,
              sm: 3,
            },
            pb: 1,
          }}
        >
          <Stack
            spacing={2}
            sx={{
              pt: 1,
            }}
          >
            <TextField
              label="Device Name"
              placeholder="e.g. Smart Energy Meter"
              value={form.name}
              onChange={(event) =>
                handleFormChange(
                  "name",
                  event.target.value
                )
              }
              fullWidth
              autoFocus
              sx={dialogFieldStyles}
            />

            <TextField
              select
              label="Device Type"
              value={form.type}
              onChange={(event) =>
                handleFormChange(
                  "type",
                  event.target.value
                )
              }
              fullWidth
              sx={dialogFieldStyles}
            >
              <MenuItem value="Smart Energy Meter">
                Smart Energy Meter
              </MenuItem>

              <MenuItem value="Smart Plug">
                Smart Plug
              </MenuItem>

              <MenuItem value="Electric Vehicle">
                Electric Vehicle
              </MenuItem>

              <MenuItem value="Solar Monitor">
                Solar Monitor
              </MenuItem>

              <MenuItem value="Home Sensor">
                Home Sensor
              </MenuItem>

              <MenuItem value="Other">
                Other
              </MenuItem>
            </TextField>

            <TextField
              label="Location"
              placeholder="e.g. Home"
              value={form.location}
              onChange={(event) =>
                handleFormChange(
                  "location",
                  event.target.value
                )
              }
              fullWidth
              sx={dialogFieldStyles}
            />
          </Stack>
        </DialogContent>

        <DialogActions
          sx={{
            px: {
              xs: 2,
              sm: 3,
            },
            py: 2.5,
            gap: 1,
            flexWrap: "wrap",
          }}
        >
          <Button
            onClick={closeAddDialog}
            disabled={saving}
            sx={{
              minHeight: 42,
              px: 2,
              borderRadius: "11px",
              textTransform: "none",
              color: "#68766E",
              fontWeight: 750,
              flexShrink: 0,
              "&:hover": {
                backgroundColor: "#F3F6F4",
              },
            }}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={handleAddDevice}
            disabled={saving}
            startIcon={
              saving ? (
                <CircularProgress
                  size={16}
                  color="inherit"
                />
              ) : (
                <AddOutlinedIcon />
              )
            }
            sx={{
              minHeight: 42,
              px: 2,
              borderRadius: "11px",
              textTransform: "none",
              fontWeight: 850,
              maxWidth: "100%",
              background:
                "linear-gradient(135deg, #168A52 0%, #08763E 100%)",
              boxShadow:
                "0 8px 20px rgba(22,138,82,0.18)",
              "&:hover": {
                background:
                  "linear-gradient(135deg, #0F7545 0%, #075E32 100%)",
              },
            }}
          >
            {saving
              ? "Connecting..."
              : "Connect Device"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

/* =========================================================
   DIALOG FIELD STYLES
========================================================= */

const dialogFieldStyles = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "12px",
    backgroundColor: "#FBFDFC",
    "& fieldset": {
      borderColor: "#DDE6E1",
    },
    "&:hover fieldset": {
      borderColor: "#B9D6C5",
    },
    "&.Mui-focused fieldset": {
      borderColor: "#16804F",
      borderWidth: 1.5,
    },
  },

  "& .MuiInputLabel-root": {
    fontSize: 13,
    color: "#718078",
  },

  "& .MuiInputLabel-root.Mui-focused": {
    color: "#16804F",
  },
};

/* =========================================================
   SUMMARY CARD
========================================================= */

interface SummaryCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle: string;
  iconBg: string;
  iconColor: string;
  accent: string;
}

const SummaryCard = ({
  icon,
  title,
  value,
  subtitle,
  iconBg,
  iconColor,
  accent,
}: SummaryCardProps) => {
  return (
    <Card
      elevation={0}
      sx={{
        position: "relative",
        minHeight: 122,
        minWidth: 0,
        width: "100%",
        borderRadius: "18px",
        border: "1px solid #E1E8E3",
        backgroundColor: "#FFFFFF",
        boxShadow:
          "0 8px 28px rgba(20,50,35,0.045)",
        overflow: "hidden",
        transition: "all .2s ease",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow:
            "0 13px 32px rgba(20,50,35,0.07)",
          borderColor: "#D7E4DC",
        },
      }}
    >
      <Box
        sx={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          background:
            `linear-gradient(180deg, ${accent}, ${accent}99)`,
        }}
      />

      <CardContent
        sx={{
          p: 2.1,
          "&:last-child": {
            pb: 2.1,
          },
        }}
      >
        <Stack
          direction="row"
          spacing={1.4}
          sx={{
            alignItems: "center",
            minWidth: 0,
          }}
        >
          <Box
            sx={{
              width: 50,
              height: 50,
              minWidth: 50,
              borderRadius: "15px",
              backgroundColor: iconBg,
              color: iconColor,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid rgba(0,0,0,0.025)",
            }}
          >
            {icon}
          </Box>

          <Box
            sx={{
              minWidth: 0,
              flex: 1,
              overflow: "hidden",
            }}
          >
            <Typography
              sx={{
                fontSize: 11.5,
                fontWeight: 750,
                color: "#718078",
              }}
            >
              {title}
            </Typography>

            <Typography
              sx={{
                mt: 0.1,
                fontSize: {
                  xs: 24,
                  sm: 26,
                },
                lineHeight: 1.15,
                fontWeight: 900,
                letterSpacing: "-0.7px",
                color: "#17221C",
              }}
            >
              {value}
            </Typography>

            <Typography
              sx={{
                mt: 0.35,
                fontSize: 10.5,
                color: "#87938C",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {subtitle}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default MyDevices;
