import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { useNavigate } from 'react-router-dom';

export const ProfilePage = () => {
  const { user } = useAuth();
  const { getProfileData, updateProfile, loading, error } = useProfile();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({ name: '', phone: '', address: '' });
  
  // Inicializar formData cuando el usuario está disponible
  useEffect(() => {
    if (user) {
      const userData = getProfileData(user);
      console.log('User data loaded:', userData);
      setFormData(userData);
    }
  }, [user]);

  // Actualizar formData cuando cambia el usuario
  useEffect(() => {
    console.log('Current user:', user);
    console.log('Current formData:', formData);
  }, [user, formData]);
  const [editingField, setEditingField] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (field: string) => {
    if (!user) return;
    
    const success = await updateProfile(user, formData);
    if (success) {
      setEditingField(null);
    }
  };

  if (!user) {
    return <div className="p-4">Por favor inicia sesión para ver tu perfil</div>;
  }

  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Mi Perfil</h1>
      
      <div className="space-y-6">
        {/* Nombre */}
        <div className="border-b pb-4">
          <Label>Nombre</Label>
          {editingField === 'name' ? (
            <div className="flex gap-2 mt-2">
              <Input
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="flex-1"
              />
              <Button 
                onClick={() => handleSubmit('name')}
                disabled={loading}
                className="px-3 py-1 text-sm"
              >
                {loading ? 'Guardando...' : 'Guardar'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setEditingField(null)}
                className="px-3 py-1 text-sm"
              >
                Cancelar
              </Button>
            </div>
          ) : (
            <div className="flex justify-between items-center mt-2">
              <p>{formData.name || 'No especificado'}</p>
              <Button 
                variant="outline" 
                className="px-3 py-1 text-sm"
                onClick={() => setEditingField('name')}
              >
                Modificar
              </Button>
            </div>
          )}
        </div>

        {/* Teléfono */}
        <div className="border-b pb-4">
          <Label>Teléfono</Label>
          {editingField === 'phone' ? (
            <div className="flex gap-2 mt-2">
              <Input
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                className="flex-1"
              />
              <Button 
                onClick={() => handleSubmit('phone')}
                disabled={loading}
                className="px-3 py-1 text-sm"
              >
                {loading ? 'Guardando...' : 'Guardar'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setEditingField(null)}
                className="px-3 py-1 text-sm"
              >
                Cancelar
              </Button>
            </div>
          ) : (
            <div className="flex justify-between items-center mt-2">
              <p>{formData.phone || 'No especificado'}</p>
              <Button 
                variant="outline" 
                className="px-3 py-1 text-sm"
                onClick={() => setEditingField('phone')}
              >
                Modificar
              </Button>
            </div>
          )}
        </div>

        {/* Dirección */}
        <div className="border-b pb-4">
          <Label>Dirección</Label>
          {editingField === 'address' ? (
            <div className="flex gap-2 mt-2">
              <Input
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="flex-1"
              />
              <Button 
                onClick={() => handleSubmit('address')}
                disabled={loading}
                className="px-3 py-1 text-sm"
              >
                {loading ? 'Guardando...' : 'Guardar'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setEditingField(null)}
                className="px-3 py-1 text-sm"
              >
                Cancelar
              </Button>
            </div>
          ) : (
            <div className="flex justify-between items-center mt-2">
              <p>{formData.address || 'No especificado'}</p>
              <Button 
                variant="outline" 
                className="px-3 py-1 text-sm"
                onClick={() => setEditingField('address')}
              >
                Modificar
              </Button>
            </div>
          )}
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="pt-4">
          <Button variant="outline" onClick={() => navigate('/')}>
            Volver
          </Button>
        </div>
      </div>
    </div>
  );
};
