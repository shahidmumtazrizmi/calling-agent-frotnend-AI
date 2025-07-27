import React, { useState, useEffect } from 'react';
import { Grid, Paper, Typography, Box, Card, CardContent, CircularProgress } from '@mui/material';
import { Phone as PhoneIcon, Warning as WarningIcon, AccessTime as AccessTimeIcon } from '@mui/icons-material';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import PageHeader from '../../components/common/PageHeader';
import ErrorMessage from '../../components/common/ErrorMessage';
import analyticsService, { CallStatistics, CallVolumeData, AlertStatistics } from '../../services/analyticsService';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const Dashboard: React.FC = () => {
  const [callStats, setCallStats] = useState<CallStatistics | null>(null);
  const [alertStats, setAlertStats] = useState<AlertStatistics | null>(null);
  const [callVolume, setCallVolume] = useState<CallVolumeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch all required data in parallel
        const [callStatsData, alertStatsData, callVolumeData] = await Promise.all([
          analyticsService.getCallStatistics(),
          analyticsService.getAlertStatistics(),
          analyticsService.getDailyCallVolume(7),
        ]);

        setCallStats(callStatsData);
        setAlertStats(alertStatsData);
        setCallVolume(callVolumeData);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Chart data and options
  const chartData = {
    labels: callVolume.map((item) => {
      const date = new Date(item.date);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }),
    datasets: [
      {
        label: 'Call Volume',
        data: callVolume.map((item) => item.count),
        borderColor: '#3f51b5',
        backgroundColor: 'rgba(63, 81, 181, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Daily Call Volume (Last 7 Days)',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
        },
      },
    },
  };

  // Stat card component
  const StatCard = ({ title, value, icon, color }: { title: string; value: string | number; icon: React.ReactNode; color: string }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              p: 1,
              borderRadius: 1,
              bgcolor: `${color}.light`,
              color: `${color}.main`,
              mr: 2,
            }}
          >
            {icon}
          </Box>
          <Typography variant="h6" component="div">
            {title}
          </Typography>
        </Box>
        <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={() => window.location.reload()} />;
  }

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Overview of your voice agent system" />

      <Grid container spacing={3}>
        {/* Call Statistics */}
        <Grid item xs={12} md={4}>
          <StatCard
            title="Total Calls"
            value={callStats?.total_calls || 0}
            icon={<PhoneIcon />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatCard
            title="Avg. Call Duration"
            value={`${callStats?.average_duration || 0} sec`}
            icon={<AccessTimeIcon />}
            color="info"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatCard
            title="Potential Scams"
            value={alertStats?.potential_scam_alerts || 0}
            icon={<WarningIcon />}
            color="error"
          />
        </Grid>

        {/* Call Volume Chart */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Line data={chartData} options={chartOptions} />
          </Paper>
        </Grid>

        {/* Call Status Breakdown */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Call Status Breakdown
            </Typography>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      bgcolor: 'success.main',
                      mr: 1,
                    }}
                  />
                  <Typography variant="body2">Completed</Typography>
                </Box>
                <Typography variant="h6">{callStats?.completed_calls || 0}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      bgcolor: 'info.main',
                      mr: 1,
                    }}
                  />
                  <Typography variant="body2">In Progress</Typography>
                </Box>
                <Typography variant="h6">{callStats?.in_progress_calls || 0}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      bgcolor: 'error.main',
                      mr: 1,
                    }}
                  />
                  <Typography variant="body2">Failed</Typography>
                </Box>
                <Typography variant="h6">{callStats?.failed_calls || 0}</Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Alert Statistics */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Alert Statistics
            </Typography>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      bgcolor: 'error.main',
                      mr: 1,
                    }}
                  />
                  <Typography variant="body2">Potential Scams</Typography>
                </Box>
                <Typography variant="h6">{alertStats?.potential_scam_alerts || 0}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      bgcolor: 'warning.main',
                      mr: 1,
                    }}
                  />
                  <Typography variant="body2">Suspicious Activity</Typography>
                </Box>
                <Typography variant="h6">{alertStats?.suspicious_activity_alerts || 0}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      bgcolor: 'info.main',
                      mr: 1,
                    }}
                  />
                  <Typography variant="body2">Other Alerts</Typography>
                </Box>
                <Typography variant="h6">{alertStats?.other_alerts || 0}</Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </>
  );
};

export default Dashboard;
