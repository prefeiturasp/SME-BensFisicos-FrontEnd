import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppRoutes from './routes/AppRoutes';
import { Toaster } from '@/components/ui/sonner';
import { UnsavedChangesProvider } from '@/components/unsaved-changes/UnsavedChangesProvider';

const client = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function RoutedApplication() {
  return (
    <UnsavedChangesProvider>
      <AppRoutes />
      <Toaster position='top-right' richColors />
    </UnsavedChangesProvider>
  );
}

const router = createBrowserRouter([
  {
    path: '*',
    element: <RoutedApplication />,
  },
]);

function App() {
  return (
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}

export default App;
