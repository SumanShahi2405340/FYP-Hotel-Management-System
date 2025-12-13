import { useState } from 'react';
import AdminLoginForm from './AdminLoginForm';
import OwnerLoginForm from './OwnerLoginForm';
import ManagerLoginForm from './ManagerLoginForm';   // Import Manager form

export default function RoleSelector() {
  const [role, setRole] = useState('');

  return (
    <div>
      <button onClick={() => setRole('dropdown')}>Choose Role</button>
      {role === 'dropdown' && (
        <select onChange={e => setRole(e.target.value)}>
          <option value="">Select</option>
          <option value="admin">Admin</option>
          <option value="owner">Owner</option>
          <option value="manager">Manager</option>
        </select>
      )}

      {role === 'admin' && <AdminLoginForm />}
      {role === 'owner' && <OwnerLoginForm />}
      {role === 'manager' && <ManagerLoginForm />}   {/*  Manager now renders */}
    </div>
  );
}
