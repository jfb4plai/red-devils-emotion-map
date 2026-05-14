import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing    from './pages/Landing';
import Auth       from './pages/Auth';
import Create     from './pages/Create';
import MyPatch    from './pages/MyPatch';
import PatchPublic from './pages/PatchPublic';
import Patchwork  from './pages/Patchwork';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"           element={<Landing />} />
        <Route path="/auth"       element={<Auth />} />
        <Route path="/creer"      element={<Create />} />
        <Route path="/mon-patch"  element={<MyPatch />} />
        <Route path="/patch/:id"  element={<PatchPublic />} />
        <Route path="/patchwork"  element={<Patchwork />} />
      </Routes>
    </BrowserRouter>
  );
}
