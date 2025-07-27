import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Tooltip,
  TextField,
  InputAdornment,
  Button,
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import EmptyState from '../../components/common/EmptyState';
import callService, { Call } from '../../services/callService';

const Calls: React.FC = () => {
  const navigate = useNavigate();
  const [calls, setCalls] = useState<Call[]>([]);
  const [totalCalls, setTotalCalls] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchCalls = async (pageNum: number, limit: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await callService.getCalls(pageNum + 1, limit);
      setCalls(response.calls);
      setTotalCalls(response.total);
    } catch (err) {
      console.error('Error fetching calls:', err);
      setError('Failed to load calls. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalls(page, rowsPerPage);
  }, [page, rowsPerPage]);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    // Implement search functionality here
    // This would typically involve an API call with the search query
    console.log('Searching for:', searchQuery);
  };

  const handleViewCall = (callId: number) => {
    navigate(`/calls/${callId}`);
  };

  const getStatusChipColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'success';
      case 'in-progress':
        return 'info';
      case 'failed':
        return 'error';
      case 'busy':
        return 'warning';
      case 'no-answer':
        return 'warning';
      default:
        return 'default';
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatPhoneNumber = (phoneNumber: string) => {
    // Format phone number for display (e.g., +1 (555) 123-4567)
    if (!phoneNumber) return '';
    
    // This is a simple formatter for US numbers, adjust as needed
    if (phoneNumber.startsWith('+1') && phoneNumber.length === 12) {
      return `+1 (${phoneNumber.substring(2, 5)}) ${phoneNumber.substring(5, 8)}-${phoneNumber.substring(8)}`;
    }
    
    return phoneNumber;
  };

  if (loading && calls.length === 0) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={() => fetchCalls(page, rowsPerPage)} />;
  }

  return (
    <>
      <PageHeader 
        title="Call History" 
        subtitle="View and manage your call records" 
      />

      <Paper sx={{ p: 2, mb: 3 }}>
        <Box component="form" onSubmit={handleSearch} sx={{ display: 'flex', mb: 2 }}>
          <TextField
            fullWidth
            placeholder="Search by phone number or call SID"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            size="small"
            sx={{ mr: 1 }}
          />
          <Button type="submit" variant="contained">
            Search
          </Button>
        </Box>

        {calls.length === 0 ? (
          <EmptyState
            title="No calls found"
            message="There are no call records to display."
            icon={<PhoneIcon fontSize="large" />}
          />
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date & Time</TableCell>
                    <TableCell>From</TableCell>
                    <TableCell>To</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Duration</TableCell>
                    <TableCell>Alerts</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {calls.map((call) => (
                    <TableRow key={call.id} hover>
                      <TableCell>
                        {new Date(call.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell>{formatPhoneNumber(call.from_number)}</TableCell>
                      <TableCell>{formatPhoneNumber(call.to_number)}</TableCell>
                      <TableCell>
                        <Chip
                          label={call.status}
                          color={getStatusChipColor(call.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{formatDuration(call.duration)}</TableCell>
                      <TableCell>
                        {/* This would be populated from the actual data */}
                        {Math.random() > 0.7 && (
                          <Tooltip title="Potential scam detected">
                            <WarningIcon color="error" fontSize="small" />
                          </Tooltip>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="View call details">
                          <IconButton
                            size="small"
                            onClick={() => handleViewCall(call.id)}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={totalCalls}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </>
        )}
      </Paper>
    </>
  );
};

export default Calls;

// Import for the EmptyState icon
import { Phone as PhoneIcon } from '@mui/icons-material';
