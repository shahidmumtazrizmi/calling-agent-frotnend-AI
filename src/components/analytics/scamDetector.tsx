
// import React from 'react';
// import { render, screen } from '@testing-library/react';
// import { rest } from 'msw';
// import { setupServer } from 'msw/node';
// import ScamDetector from '../components/ScamDetector';

// // Mock Next.js router
// jest.mock('next/router', () => ({
//   useRouter: () => ({
//     route: '/',
//     pathname: '/',
//     query: {},
//     asPath: '/',
//   }),
// }));

// // Mock environment variables
// process.env.NEXT_PUBLIC_API_URL = 'http://localhost:8000';

// // Setup MSW server for mocking API calls
// const server = setupServer(
//   rest.get('http://localhost:8000/api/analytics/calls/summary', (req, res, ctx) => {
//     return res(ctx.json({
//       total_calls: 100,
//       average_duration: 120.5,
//       calls_with_alerts: 10,
//     }));
//   }),
// );

// beforeAll(() => server.listen());
// afterEach(() => server.resetHandlers());
// afterAll(() => server.close());

// describe('ScamDetector Component', () => {
//   test('renders Scam Detector heading', async () => {
//     render(<ScamDetector />);
//     const headingElement = screen.getByText(/scam detector/i);
//     expect(headingElement).toBeInTheDocument();

//     // Wait for analytics data to load (async useEffect)
//     const analyticsElement = await screen.findByText(/total calls: 100/i);
//     expect(analyticsElement).toBeInTheDocument();
//   });

//   test('renders Analyze button', () => {
//     render(<ScamDetector />);
//     const buttonElement = screen.getByRole('button', { name: /analyze/i });
//     expect(buttonElement).toBeInTheDocument();
//   });
// });
