import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface Clinic {
  id: number;
  name: string;
  email: string;
  ownedPets: number;
  importedPets: number;
}

interface PaginatedResponse {
  data: Clinic[];
  current_page: number;
  last_page: number;
  total: number;
}

interface Props {
  clinics: PaginatedResponse;
  search: string;
}

export default function ClinicVisibility({ clinics, search: initialSearch }: Props) {
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null);
  const [canViewClinics, setCanViewClinics] = useState<Array<{ id: number; name: string; email: string }>>([]);
  const [canBeViewedByClinics, setCanBeViewedByClinics] = useState<Array<{ id: number; name: string; email: string }>>([]);
  const [search, setSearch] = useState(initialSearch);
  const [grantingClinic, setGrantingClinic] = useState('');
  const [receivingClinic, setReceivingClinic] = useState('');
  const [isGranting, setIsGranting] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const { success, error } = useToast();

  const handleSelectClinic = async (clinic: Clinic) => {
    setSelectedClinic(clinic);
    setLoadingPermissions(true);

    try {
      const response = await fetch(`/clinic-visibility/${clinic.id}/permissions`);
      if (!response.ok) throw new Error('Failed to load permissions');

      const data = await response.json();
      setCanViewClinics(data.canView);
      setCanBeViewedByClinics(data.canBeViewedBy);
    } catch (err) {
      error('Failed to load clinic permissions');
    } finally {
      setLoadingPermissions(false);
    }
  };

  const handleGrantPermission = async () => {
    if (!grantingClinic || !receivingClinic) {
      error('Please select both clinics');
      return;
    }

    if (grantingClinic === receivingClinic) {
      error('Cannot grant permission to the same clinic');
      return;
    }

    setIsGranting(true);

    try {
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';
      const response = await fetch('/clinic-visibility/grant-permission', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-TOKEN': csrfToken,
        },
        body: JSON.stringify({
          granting_clinic_id: parseInt(grantingClinic, 10),
          receiving_clinic_id: parseInt(receivingClinic, 10),
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to grant permission');
      }

      const data = await response.json();
      success(data.message);

      if (selectedClinic) {
        handleSelectClinic(selectedClinic);
      }

      setGrantingClinic('');
      setReceivingClinic('');
    } catch (err) {
      error(err instanceof Error ? err.message : 'Failed to grant permission');
    } finally {
      setIsGranting(false);
    }
  };

  const handleRevokePermission = async (grantingId: number, receivingId: number) => {
    if (!confirm('Are you sure you want to revoke this permission? This will immediately remove access.')) return;

    setIsRevoking(true);

    try {
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';
      const response = await fetch('/clinic-visibility/revoke-permission', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-TOKEN': csrfToken,
        },
        body: JSON.stringify({
          granting_clinic_id: grantingId,
          receiving_clinic_id: receivingId,
        }),
      });

      if (!response.ok) {
        const result = await response.json().catch(() => null);
        const message = result?.error || 'Failed to revoke permission. Please try again.';
        throw new Error(message);
      }

      const data = await response.json();
      success(data.message || 'Permission revoked successfully.');

      if (selectedClinic) {
        handleSelectClinic(selectedClinic);
      }
    } catch (err) {
      error(err instanceof Error ? err.message : 'Could not revoke access. Please contact the clinic administrator if this continues.');
    } finally {
      setIsRevoking(false);
    }
  };

  return (
    <AdminLayout title="Clinic Visibility" description="Manage clinic-level history access permissions.">
      <Head title="Clinic Visibility" />
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Grant Clinic Visibility Permission</CardTitle>
            <CardDescription>Allow one clinic to view another clinic's consultation history.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Clinic that owns the history</label>
                <Select value={grantingClinic} onValueChange={setGrantingClinic}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select clinic" />
                  </SelectTrigger>
                  <SelectContent>
                    {clinics.data.map((clinic) => (
                      <SelectItem key={clinic.id} value={clinic.id.toString()}>
                        {clinic.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Clinic to grant access to</label>
                <Select value={receivingClinic} onValueChange={setReceivingClinic}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select clinic" />
                  </SelectTrigger>
                  <SelectContent>
                    {clinics.data.map((clinic) => (
                      <SelectItem key={clinic.id} value={clinic.id.toString()}>
                        {clinic.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleGrantPermission} disabled={isGranting || !grantingClinic || !receivingClinic}>
              {isGranting ? 'Granting...' : 'Grant Permission'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>All Clinics</CardTitle>
            <CardDescription>Click a clinic to view and manage its permissions.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by clinic name or email"
              />
              <div className="overflow-hidden rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Clinic Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead className="text-right">Owned Pets</TableHead>
                      <TableHead className="text-right">Imported Pets</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clinics.data.map((clinic) => (
                      <TableRow key={clinic.id} className="hover:bg-neutral-50">
                        <TableCell>{clinic.name}</TableCell>
                        <TableCell>{clinic.email}</TableCell>
                        <TableCell className="text-right">{clinic.ownedPets}</TableCell>
                        <TableCell className="text-right">{clinic.importedPets}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" onClick={() => handleSelectClinic(clinic)}>
                            View Permissions
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>

        {selectedClinic ? (
          <div className="grid gap-6 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{selectedClinic.name} can view</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingPermissions ? (
                  <div>Loading permissions...</div>
                ) : canViewClinics.length === 0 ? (
                  <div>No permissions granted yet.</div>
                ) : (
                  canViewClinics.map((clinic) => (
                    <div key={clinic.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <div className="font-medium">{clinic.name}</div>
                        <div className="text-sm text-neutral-500">{clinic.email}</div>
                      </div>
                      <Button variant="destructive" size="sm" disabled={isRevoking} onClick={() => handleRevokePermission(clinic.id, selectedClinic.id)}>
                        {isRevoking ? 'Revoking...' : 'Revoke'}
                      </Button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Can view {selectedClinic.name}</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingPermissions ? (
                  <div>Loading permissions...</div>
                ) : canBeViewedByClinics.length === 0 ? (
                  <div>No clinics have access yet.</div>
                ) : (
                  canBeViewedByClinics.map((clinic) => (
                    <div key={clinic.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <div className="font-medium">{clinic.name}</div>
                        <div className="text-sm text-neutral-500">{clinic.email}</div>
                      </div>
                      <Button variant="destructive" size="sm" disabled={isRevoking} onClick={() => handleRevokePermission(selectedClinic.id, clinic.id)}>
                        {isRevoking ? 'Revoking...' : 'Revoke'}
                      </Button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        ) : null}
      </div>
    </AdminLayout>
  );
}
