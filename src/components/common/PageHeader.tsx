import React from 'react';
import { Box, Typography, Breadcrumbs, Link as MuiLink, Paper } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  action?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, breadcrumbs, action }) => {
  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: 3, 
        mb: 3, 
        borderRadius: 2,
        background: 'transparent',
        display: 'flex',
        flexDirection: 'column',
        gap: 1
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom={!!subtitle}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="subtitle1" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
        {action && <Box>{action}</Box>}
      </Box>

      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumbs aria-label="breadcrumb" sx={{ mt: 1 }}>
          {breadcrumbs.map((item, index) => {
            const isLast = index === breadcrumbs.length - 1;

            return isLast ? (
              <Typography key={item.label} color="text.primary">
                {item.label}
              </Typography>
            ) : (
              <MuiLink
                key={item.label}
                component={RouterLink}
                to={item.path || '#'}
                underline="hover"
                color="inherit"
              >
                {item.label}
              </MuiLink>
            );
          })}
        </Breadcrumbs>
      )}
    </Paper>
  );
};

export default PageHeader;
