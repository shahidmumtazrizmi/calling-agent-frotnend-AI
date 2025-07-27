import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Button,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Phone as PhoneIcon,
  Check as CheckIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import EmptyState from '../../components/common/EmptyState';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import numberService, { PhoneNumber, AvailableNumber } from '../../services/numberService';

const Numbers: React.FC = () => {
  const [numbers, setNumbers] = useState<PhoneNumber[]>([]);
  const [totalNumbers, setTotalNumbers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Search dialog state
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [searchParams, setSearchParams] = useState({
    country_code: 'US',
    area_code: '',
    contains: '',
  });
  const [searchResults, setSearchResults] = useState<AvailableNumber[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentNumber, setCurrentNumber] = useState<PhoneNumber | null>(null);
  const [editFormData, setEditFormData] = useState({
    friendly_name: '',
    status: '',
  });

  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [numberToDelete, setNumberToDelete] = useState<PhoneNumber | null>(null);

  // Purchase dialog state
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [numberToPurchase, setNumberToPurchase] = useState<AvailableNumber | null>(null);
  const [purchaseFormData, setPurchaseFormData] = useState({
    friendly_name: '',
  });

  const fetchNumbers = async (pageNum: number, limit: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await numberService.getNumbers(pageNum + 1, limit);
      setNumbers(response.numbers);
      setTotalNumbers(response.total);
    } catch (err) {
      console.error('Error fetching phone numbers:', err);
      setError('Failed to load phone numbers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNumbers(page, rowsPerPage);
  }, [page, rowsPerPage]);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Search dialog handlers
  const handleOpenSearchDialog = () => {
    setSearchDialogOpen(true);
    setSearchResults([]);
    setSearchError(null);
  };

  const handleCloseSearchDialog = () => {
    setSearchDialogOpen(false);
  };

  const handleSearchParamChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    setSearchParams(prev => ({
      ...prev,
      [name as string]: value,
    }));
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearchLoading(true);
    setSearchError(null);
    try {
      const response = await numberService.searchAvailableNumbers({
        country_code: searchParams.country_code,
        area_code: searchParams.area_code || undefined,
        contains: searchParams.contains || undefined,
        limit: 10,
      });
      setSearchResults(response.numbers);
    } catch (err) {
      console.error('Error searching for phone numbers:', err);
      setSearchError('Failed to search for phone numbers. Please try again.');
    } finally {
      setSearchLoading(false);
    }
  };

  // Edit dialog handlers
  const handleOpenEditDialog = (number: PhoneNumber) => {
    setCurrentNumber(number);
    setEditFormData({
      friendly_name: number.friendly_name || '',
      status: number.status,
    });
    setEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setCurrentNumber(null);
  };

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name as string]: value,
    }));
  };

  const handleUpdateNumber = async () => {
    if (!currentNumber) return;

    try {
      await numberService.updateNumber(currentNumber.id, {
        friendly_name: editFormData.friendly_name || undefined,
        status: editFormData.status as any,
      });

      // Refresh the numbers list
      fetchNumbers(page, rowsPerPage);
      handleCloseEditDialog();
    } catch (err) {
      console.error('Error updating phone number:', err);
      // You could set an error state for the edit form here
    }
  };

  // Delete dialog handlers
  const handleOpenDeleteDialog = (number: PhoneNumber) => {
    setNumberToDelete(number);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setNumberToDelete(null);
  };

  const handleDeleteNumber = async () => {
    if (!numberToDelete) return;

    try {
      await numberService.deleteNumber(numberToDelete.id);

      // Refresh the numbers list
      fetchNumbers(page, rowsPerPage);
      handleCloseDeleteDialog();
    } catch (err) {
      console.error('Error deleting phone number:', err);
      // You could set an error state for the delete dialog here
    }
  };

  // Purchase dialog handlers
  const handleOpenPurchaseDialog = (number: AvailableNumber) => {
    setNumberToPurchase(number);
    setPurchaseFormData({
      friendly_name: number.friendly_name,
    });
    setPurchaseDialogOpen(true);
  };

  const handleClosePurchaseDialog = () => {
    setPurchaseDialogOpen(false);
    setNumberToPurchase(null);
  };

  const handlePurchaseFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPurchaseFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePurchaseNumber = async () => {
    if (!numberToPurchase) return;

    try {
      await numberService.purchaseNumber({
        phone_number: numberToPurchase.phone_number,
        friendly_name: purchaseFormData.friendly_name,
      });

      // Refresh the numbers list
      fetchNumbers(page, rowsPerPage);
      handleClosePurchaseDialog();
      handleCloseSearchDialog();
    } catch (err) {
      console.error('Error purchasing phone number:', err);
      // You could set an error state for the purchase form here
    }
  };

  const formatPhoneNumber = (phoneNumber: string) => {
    if (!phoneNumber) return '';
    
    // This is a simple formatter for US numbers, adjust as needed
    if (phoneNumber.startsWith('+1') && phoneNumber.length === 12) {
      return `+1 (${phoneNumber.substring(2, 5)}) ${phoneNumber.substring(5, 8)}-${phoneNumber.substring(8)}`;
    }
    
    return phoneNumber;
  };

  if (loading && numbers.length === 0) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={() => fetchNumbers(page, rowsPerPage)} />;
  }

  return (
    <>
      <PageHeader 
        title="Phone Numbers" 
        subtitle="Manage your phone numbers for voice agent calls" 
        action={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenSearchDialog}
          >
            Add Phone Number
          </Button>
        }
      />

      <Paper sx={{ p: 2, mb: 3 }}>
        {numbers.length === 0 ? (
          <EmptyState
            title="No phone numbers found"
            message="You don't have any phone numbers yet. Add a phone number to get started."
            icon={<PhoneIcon fontSize="large" />}
            actionText="Add Phone Number"
            onAction={handleOpenSearchDialog}
          />
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Phone Number</TableCell>
                    <TableCell>Friendly Name</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Capabilities</TableCell>
                    <TableCell>Added On</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {numbers.map((number) => (
                    <TableRow key={number.id} hover>
                      <TableCell>{formatPhoneNumber(number.phone_number)}</TableCell>
                      <TableCell>{number.friendly_name || '-'}</TableCell>
                      <TableCell>
                        <Chip
                          label={number.status}
                          color={
                            number.status === 'active'
                              ? 'success'
                              : number.status === 'inactive'
                              ? 'default'
                              : 'warning'
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          {number.capabilities?.voice && (
                            <Tooltip title="Voice Capable">
                              <Chip label="Voice" size="small" color="primary" variant="outlined" />
                            </Tooltip>
                          )}
                          {number.capabilities?.sms && (
                            <Tooltip title="SMS Capable">
                              <Chip label="SMS" size="small" color="secondary" variant="outlined" />
                            </Tooltip>
                          )}
                          {number.capabilities?.mms && (
                            <Tooltip title="MMS Capable">
                              <Chip label="MMS" size="small" color="info" variant="outlined" />
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        {new Date(number.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenEditDialog(number)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenDeleteDialog(number)}
                              color="error"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={totalNumbers}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </>
        )}
      </Paper>

      {/* Search Phone Numbers Dialog */}
      <Dialog open={searchDialogOpen} onClose={handleCloseSearchDialog} maxWidth="md" fullWidth>
        <DialogTitle>Search for Phone Numbers</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSearch} sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel id="country-code-label">Country</InputLabel>
                  <Select
                    labelId="country-code-label"
                    name="country_code"
                    value={searchParams.country_code}
                    onChange={handleSearchParamChange}
                    label="Country"
                  >
                    <MenuItem value="US">United States</MenuItem>
                    <MenuItem value="CA">Canada</MenuItem>
                    <MenuItem value="GB">United Kingdom</MenuItem>
                    <MenuItem value="AU">Australia</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Area Code"
                  name="area_code"
                  value={searchParams.area_code}
                  onChange={handleSearchParamChange}
                  helperText="e.g., 415"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Contains Digits"
                  name="contains"
                  value={searchParams.contains}
                  onChange={handleSearchParamChange}
                  helperText="e.g., 2355"
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  disabled={searchLoading}
                >
                  {searchLoading ? 'Searching...' : 'Search'}
                </Button>
              </Grid>
            </Grid>
          </Box>

          {searchError && (
            <Box sx={{ mt: 2 }}>
              <ErrorMessage message={searchError} />
            </Box>
          )}

          {searchResults.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Available Phone Numbers
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Phone Number</TableCell>
                      <TableCell>Location</TableCell>
                      <TableCell>Capabilities</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {searchResults.map((number) => (
                      <TableRow key={number.phone_number} hover>
                        <TableCell>{formatPhoneNumber(number.phone_number)}</TableCell>
                        <TableCell>
                          {number.locality && number.region
                            ? `${number.locality}, ${number.region}`
                            : number.region || number.locality || '-'}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            {number.capabilities.voice && (
                              <Tooltip title="Voice Capable">
                                <Chip label="Voice" size="small" color="primary" variant="outlined" />
                              </Tooltip>
                            )}
                            {number.capabilities.sms && (
                              <Tooltip title="SMS Capable">
                                <Chip label="SMS" size="small" color="secondary" variant="outlined" />
                              </Tooltip>
                            )}
                            {number.capabilities.mms && (
                              <Tooltip title="MMS Capable">
                                <Chip label="MMS" size="small" color="info" variant="outlined" />
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() => handleOpenPurchaseDialog(number)}
                          >
                            Purchase
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {searchResults.length === 0 && !searchLoading && !searchError && searchParams.area_code && (
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography color="text.secondary">
                No phone numbers found matching your criteria. Try different search parameters.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSearchDialog}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Phone Number Dialog */}
      <Dialog open={editDialogOpen} onClose={handleCloseEditDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Phone Number</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  value={currentNumber ? formatPhoneNumber(currentNumber.phone_number) : ''}
                  disabled
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Friendly Name"
                  name="friendly_name"
                  value={editFormData.friendly_name}
                  onChange={handleEditFormChange}
                  helperText="A descriptive name for this phone number"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel id="status-label">Status</InputLabel>
                  <Select
                    labelId="status-label"
                    name="status"
                    value={editFormData.status}
                    onChange={handleEditFormChange}
                    label="Status"
                  >
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                  </Select>
                  <FormHelperText>
                    Set to inactive to temporarily disable this number
                  </FormHelperText>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog}>Cancel</Button>
          <Button onClick={handleUpdateNumber} variant="contained">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete Phone Number"
        message={`Are you sure you want to delete the phone number ${numberToDelete ? formatPhoneNumber(numberToDelete.phone_number) : ''}? This action cannot be undone.`}
        confirmText="Delete"
        confirmColor="error"
        onConfirm={handleDeleteNumber}
        onCancel={handleCloseDeleteDialog}
      />

      {/* Purchase Phone Number Dialog */}
      <Dialog open={purchaseDialogOpen} onClose={handleClosePurchaseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Purchase Phone Number</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  value={numberToPurchase ? formatPhoneNumber(numberToPurchase.phone_number) : ''}
                  disabled
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Friendly Name"
                  name="friendly_name"
                  value={purchaseFormData.friendly_name}
                  onChange={handlePurchaseFormChange}
                  helperText="A descriptive name for this phone number"
                />
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="subtitle2">Capabilities:</Typography>
                  {numberToPurchase?.capabilities.voice && (
                    <Chip
                      icon={<CheckIcon fontSize="small" />}
                      label="Voice"
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  )}
                  {!numberToPurchase?.capabilities.voice && (
                    <Chip
                      icon={<ClearIcon fontSize="small" />}
                      label="Voice"
                      size="small"
                      color="default"
                      variant="outlined"
                    />
                  )}
                  {numberToPurchase?.capabilities.sms && (
                    <Chip
                      icon={<CheckIcon fontSize="small" />}
                      label="SMS"
                      size="small"
                      color="secondary"
                      variant="outlined"
                    />
                  )}
                  {!numberToPurchase?.capabilities.sms && (
                    <Chip
                      icon={<ClearIcon fontSize="small" />}
                      label="SMS"
                      size="small"
                      color="default"
                      variant="outlined"
                    />
                  )}
                  {numberToPurchase?.capabilities.mms && (
                    <Chip
                      icon={<CheckIcon fontSize="small" />}
                      label="MMS"
                      size="small"
                      color="info"
                      variant="outlined"
                    />
                  )}
                  {!numberToPurchase?.capabilities.mms && (
                    <Chip
                      icon={<ClearIcon fontSize="small" />}
                      label="MMS"
                      size="small"
                      color="default"
                      variant="outlined"
                    />
                  )}
                </Box>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePurchaseDialog}>Cancel</Button>
          <Button onClick={handlePurchaseNumber} variant="contained" color="primary">
            Purchase
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Numbers;
