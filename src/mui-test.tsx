import {
  Avatar,
  Dialog,
  Stack,
  TextField,
} from "@mui/material";

export default function MuiTest() {
  return (
    <>
      <Stack
        direction="row"
        spacing={2}
        alignItems="center"
        justifyContent="space-between"
      >
        <Avatar src="/test.png" />

        <TextField
          label="Test"
          fullWidth
        />
      </Stack>

      <Dialog
        open={false}
        onClose={() => undefined}
      >
        Test
      </Dialog>
    </>
  );
}