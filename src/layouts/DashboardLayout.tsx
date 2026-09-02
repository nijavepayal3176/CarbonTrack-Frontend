import {
  Box,
  Drawer,
} from "@mui/material";
import { Outlet } from "react-router-dom";
import { useState } from "react";

import DashboardSidebar from "../components/dashboard/DashboardSidebar";
import DashboardTopbar from "../components/dashboard/DashboardTopbar";

const DRAWER_WIDTH = 232;

const DashboardLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "#F8FAFC",
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

            // Sticky sidebar
            position: "fixed",
            height: "100vh",
            overflowY: "auto",
          },
        }}
      >
        <DashboardSidebar />
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
        <DashboardSidebar
          onCloseMobile={() =>
            setMobileOpen(false)
          }
        />
      </Drawer>

      {/* MAIN AREA */}

      <Box
        sx={{
          ml: {
            xs: 0,
            md: `${DRAWER_WIDTH}px`,
          },
          minHeight: "100vh",
        }}
      >
        {/* TOPBAR */}

        <DashboardTopbar
          onMobileMenu={() =>
            setMobileOpen(true)
          }
        />
 
        {/* PAGE CONTENT */}

        <Box
          component="main"
          sx={{
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

export default DashboardLayout;