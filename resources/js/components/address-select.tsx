import { useEffect, useState, useCallback } from 'react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

const PSGC_API = 'https://psgc.gitlab.io/api';

interface PsgcRegion {
    code: string;
    name: string;
    regionName: string;
}

interface PsgcProvince {
    code: string;
    name: string;
    regionCode: string;
}

interface PsgcCityMunicipality {
    code: string;
    name: string;
    provinceCode: string;
    isCity: boolean;
    isMunicipality: boolean;
}

interface PsgcBarangay {
    code: string;
    name: string;
}

export interface AddressData {
    region: string;
    province: string;
    city: string;
    barangay: string;
    street: string;
    zipCode: string;
}

interface AddressSelectProps {
    value: AddressData;
    onChange: (data: AddressData) => void;
    errors?: {
        region?: string;
        province?: string;
        city?: string;
        barangay?: string;
        street?: string;
        zipCode?: string;
    };
}

export default function AddressSelect({ value, onChange, errors }: AddressSelectProps) {
    const [regions, setRegions] = useState<PsgcRegion[]>([]);
    const [provinces, setProvinces] = useState<PsgcProvince[]>([]);
    const [cities, setCities] = useState<PsgcCityMunicipality[]>([]);
    const [barangays, setBarangays] = useState<PsgcBarangay[]>([]);

    const [selectedRegionCode, setSelectedRegionCode] = useState('');
    const [selectedProvinceCode, setSelectedProvinceCode] = useState('');
    const [selectedCityCode, setSelectedCityCode] = useState('');
    const [selectedBarangayCode, setSelectedBarangayCode] = useState('');

    const [loadingRegions, setLoadingRegions] = useState(false);
    const [loadingProvinces, setLoadingProvinces] = useState(false);
    const [loadingCities, setLoadingCities] = useState(false);
    const [loadingBarangays, setLoadingBarangays] = useState(false);

    // Fetch regions on mount
    useEffect(() => {
        setLoadingRegions(true);
        fetch(`${PSGC_API}/regions/`)
            .then(res => res.json())
            .then((data: PsgcRegion[]) => {
                setRegions(data.sort((a, b) => a.name.localeCompare(b.name)));
            })
            .catch(console.error)
            .finally(() => setLoadingRegions(false));
    }, []);

    // Fetch provinces when region changes
    const handleRegionChange = useCallback((regionCode: string) => {
        setSelectedRegionCode(regionCode);
        setSelectedProvinceCode('');
        setSelectedCityCode('');
        setSelectedBarangayCode('');
        setProvinces([]);
        setCities([]);
        setBarangays([]);

        const region = regions.find(r => r.code === regionCode);
        onChange({
            ...value,
            region: region?.name ?? '',
            province: '',
            city: '',
            barangay: '',
        });

        if (regionCode) {
            setLoadingProvinces(true);
            fetch(`${PSGC_API}/regions/${regionCode}/provinces/`)
                .then(res => res.json())
                .then((data: PsgcProvince[]) => {
                    setProvinces(data.sort((a, b) => a.name.localeCompare(b.name)));
                })
                .catch(console.error)
                .finally(() => setLoadingProvinces(false));
        }
    }, [regions, value, onChange]);

    // Fetch cities/municipalities when province changes
    const handleProvinceChange = useCallback((provinceCode: string) => {
        setSelectedProvinceCode(provinceCode);
        setSelectedCityCode('');
        setSelectedBarangayCode('');
        setCities([]);
        setBarangays([]);

        const province = provinces.find(p => p.code === provinceCode);
        onChange({
            ...value,
            province: province?.name ?? '',
            city: '',
            barangay: '',
        });

        if (provinceCode) {
            setLoadingCities(true);
            fetch(`${PSGC_API}/provinces/${provinceCode}/cities-municipalities/`)
                .then(res => res.json())
                .then((data: PsgcCityMunicipality[]) => {
                    setCities(data.sort((a, b) => a.name.localeCompare(b.name)));
                })
                .catch(console.error)
                .finally(() => setLoadingCities(false));
        }
    }, [provinces, value, onChange]);

    // Fetch barangays when city changes
    const handleCityChange = useCallback((cityCode: string) => {
        setSelectedCityCode(cityCode);
        setSelectedBarangayCode('');
        setBarangays([]);

        const city = cities.find(c => c.code === cityCode);
        onChange({
            ...value,
            city: city?.name ?? '',
            barangay: '',
        });

        if (cityCode) {
            setLoadingBarangays(true);
            fetch(`${PSGC_API}/cities-municipalities/${cityCode}/barangays/`)
                .then(res => res.json())
                .then((data: PsgcBarangay[]) => {
                    setBarangays(data.sort((a, b) => a.name.localeCompare(b.name)));
                })
                .catch(console.error)
                .finally(() => setLoadingBarangays(false));
        }
    }, [cities, value, onChange]);

    const handleBarangayChange = useCallback((barangayCode: string) => {
        setSelectedBarangayCode(barangayCode);
        const barangay = barangays.find(b => b.code === barangayCode);
        onChange({
            ...value,
            barangay: barangay?.name ?? '',
        });
    }, [barangays, value, onChange]);

    return (
        <div className="space-y-3">
            {/* Region */}
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                    <label className="text-sm font-medium">Region *</label>
                    <Select value={selectedRegionCode} onValueChange={handleRegionChange}>
                        <SelectTrigger>
                            <SelectValue placeholder={loadingRegions ? 'Loading...' : 'Select region'} />
                        </SelectTrigger>
                        <SelectContent>
                            {loadingRegions ? (
                                <div className="flex items-center justify-center py-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                </div>
                            ) : (
                                regions.map(r => (
                                    <SelectItem key={r.code} value={r.code}>
                                        {r.name}
                                    </SelectItem>
                                ))
                            )}
                        </SelectContent>
                    </Select>
                    {errors?.region && <div className="text-red-500 text-xs">{errors.region}</div>}
                </div>

                {/* Province */}
                <div className="space-y-1">
                    <label className="text-sm font-medium">Province *</label>
                    <Select
                        value={selectedProvinceCode}
                        onValueChange={handleProvinceChange}
                        disabled={!selectedRegionCode || loadingProvinces}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder={loadingProvinces ? 'Loading...' : 'Select province'} />
                        </SelectTrigger>
                        <SelectContent>
                            {loadingProvinces ? (
                                <div className="flex items-center justify-center py-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                </div>
                            ) : (
                                provinces.map(p => (
                                    <SelectItem key={p.code} value={p.code}>
                                        {p.name}
                                    </SelectItem>
                                ))
                            )}
                        </SelectContent>
                    </Select>
                    {errors?.province && <div className="text-red-500 text-xs">{errors.province}</div>}
                </div>
            </div>

            {/* City / Barangay */}
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                    <label className="text-sm font-medium">City/Municipality *</label>
                    <Select
                        value={selectedCityCode}
                        onValueChange={handleCityChange}
                        disabled={!selectedProvinceCode || loadingCities}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder={loadingCities ? 'Loading...' : 'Select city'} />
                        </SelectTrigger>
                        <SelectContent>
                            {loadingCities ? (
                                <div className="flex items-center justify-center py-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                </div>
                            ) : (
                                cities.map(c => (
                                    <SelectItem key={c.code} value={c.code}>
                                        {c.name}
                                    </SelectItem>
                                ))
                            )}
                        </SelectContent>
                    </Select>
                    {errors?.city && <div className="text-red-500 text-xs">{errors.city}</div>}
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-medium">Barangay *</label>
                    <Select
                        value={selectedBarangayCode}
                        onValueChange={handleBarangayChange}
                        disabled={!selectedCityCode || loadingBarangays}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder={loadingBarangays ? 'Loading...' : 'Select barangay'} />
                        </SelectTrigger>
                        <SelectContent>
                            {loadingBarangays ? (
                                <div className="flex items-center justify-center py-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                </div>
                            ) : (
                                barangays.map(b => (
                                    <SelectItem key={b.code} value={b.code}>
                                        {b.name}
                                    </SelectItem>
                                ))
                            )}
                        </SelectContent>
                    </Select>
                    {errors?.barangay && <div className="text-red-500 text-xs">{errors.barangay}</div>}
                </div>
            </div>

            {/* Street & Zip */}
            <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1">
                    <label className="text-sm font-medium">Street Address</label>
                    <Input
                        placeholder="House/Bldg No., Street Name"
                        value={value.street}
                        onChange={(e) => onChange({ ...value, street: e.target.value })}
                    />
                    {errors?.street && <div className="text-red-500 text-xs">{errors.street}</div>}
                </div>
                <div className="space-y-1">
                    <label className="text-sm font-medium">Zip Code</label>
                    <Input
                        placeholder="e.g., 1000"
                        value={value.zipCode}
                        onChange={(e) => onChange({ ...value, zipCode: e.target.value })}
                    />
                    {errors?.zipCode && <div className="text-red-500 text-xs">{errors.zipCode}</div>}
                </div>
            </div>
        </div>
    );
}
