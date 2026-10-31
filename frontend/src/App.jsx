import { BrowserRouter, useRoutes } from 'react-router-dom';
import { routes } from './routes/routes';

function RouteView() { return useRoutes(routes); }

export default function App() {
  return <BrowserRouter><RouteView /></BrowserRouter>;
}
