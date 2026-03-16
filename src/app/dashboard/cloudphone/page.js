"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, orderBy, serverTimestamp, where } from "firebase/firestore";
import { Flex, Grid, Card, Heading, Text, Button, TextField, Table, IconButton, Badge, Dialog, Box, Callout, Select, AlertDialog, TextArea } from "@radix-ui/themes";
import { PlusIcon, TrashIcon, Pencil1Icon, InfoCircledIcon, Cross1Icon, CopyIcon, CheckIcon } from "@radix-ui/react-icons";
import { toast } from "sonner";

export default function CloudphoneManager() {
    const [types, setTypes] = useState([]);
    const [codes, setCodes] = useState([]);
    const [newTypeName, setNewTypeName] = useState("");
    const [newSellingPrice, setNewSellingPrice] = useState(""); // Harga Jual
    const [newCapitalPrice, setNewCapitalPrice] = useState(""); // Harga Modal
    const [selectedType, setSelectedType] = useState(null);

    const [newCode, setNewCode] = useState("");
    const [newNote, setNewNote] = useState(""); // Added Note State

    const [loading, setLoading] = useState(false);
    const [editingCode, setEditingCode] = useState(null); // { id, code, note, ... }
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editingType, setEditingType] = useState(null);
    const [error, setError] = useState("");
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [codeToDelete, setCodeToDelete] = useState(null);

    // Fetch Types on Load
    useEffect(() => {
        fetchTypes();
    }, []);

    // Fetch Codes when a Type is selected or on load (all codes)
    useEffect(() => {
        fetchCodes(selectedType?.id);
    }, [selectedType]);

    const fetchTypes = async () => {
        try {
            const q = query(collection(db, "game_types"), orderBy("createdAt", "desc"));
            const snapshot = await getDocs(q);
            const typeList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setTypes(typeList);
        } catch (err) {
            console.error("Error fetching types:", err);
        }
    };

    const fetchCodes = async (typeId) => {
        try {
            let q;
            if (typeId) {
                // Fetch codes for specific type
                q = query(collection(db, "redeem_codes"), where("typeId", "==", typeId));
            } else {
                // Fetch ALL codes
                q = query(collection(db, "redeem_codes"));
            }

            const snapshot = await getDocs(q);
            const codeList = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .sort((a, b) => {
                    const timeA = a.createdAt?.seconds || 0;
                    const timeB = b.createdAt?.seconds || 0;
                    return timeB - timeA; // Descending sort
                });
            setCodes(codeList);
        } catch (err) {
            console.error("Error fetching codes:", err);
            toast.error("Failed to fetch codes");
        }
    };

    const handleSelectType = (type) => {
        setSelectedType(type);
        if (type) {
            toast.info(`Viewing codes for "${type.name}"`);
        }
    };

    const handleAddType = async (e) => {
        e.preventDefault();
        if (!newTypeName.trim()) {
            toast.error("Please enter a type name");
            return;
        }
        setLoading(true);
        try {
            await addDoc(collection(db, "game_types"), {
                name: newTypeName,
                sellingPrice: parseFloat(newSellingPrice) || 0,
                capitalPrice: parseFloat(newCapitalPrice) || 0,
                createdAt: serverTimestamp(),
            });
            setNewTypeName("");
            setNewSellingPrice("");
            setNewCapitalPrice("");
            fetchTypes();
            toast.success(`Type "${newTypeName}" added successfully`);
        } catch (error) {
            console.error("Error adding type", error);
            toast.error(`Failed to add type: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteType = async (id) => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/types/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ typeId: id })
            });
            const data = await res.json();
            
            if (data.success) {
                const deletedType = types.find(t => t.id === id);
                if (selectedType?.id === id) handleSelectType(null);
                fetchTypes();
                toast.success(`Type "${deletedType?.name || 'Unknown'}" deleted`);
            } else {
                toast.error(data.message || 'Failed to delete type');
            }
        } catch (error) {
            console.error("Error deleting type", error);
            toast.error(`Failed to delete type: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleAddCode = async (e) => {
        e.preventDefault();
        if (!newCode.trim() || !selectedType) {
            toast.error("Please enter code(s) and select a type");
            return;
        }
        setLoading(true);

        // Split input by newline or comma to support bulk upload
        const codesToAdd = newCode.split(/[\n,]+/).map(c => c.trim()).filter(c => c);

        if (codesToAdd.length === 0) {
            toast.error("No valid codes to add");
            return;
        }

        setLoading(true);
        try {
            const promises = codesToAdd.map(code =>
                addDoc(collection(db, "redeem_codes"), {
                    code: code,
                    note: newNote, // Same note for all batch added codes
                    typeId: selectedType.id,
                    createdAt: serverTimestamp(),
                    isUsed: false,
                })
            );

            await Promise.all(promises);

            setNewCode("");
            setNewNote(""); // Reset Note
            fetchCodes(selectedType.id);
            toast.success(`${codesToAdd.length} code(s) added to "${selectedType.name}"`);
        } catch (error) {
            console.error("Error adding code", error);
            toast.error(`Failed to add codes: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCode = async () => {
        if (!codeToDelete) return;
        const id = codeToDelete;
        console.log('[Delete Code] Attempting to delete:', id);
        setLoading(true);
        try {
            const res = await fetch('/api/admin/codes/delete', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ codeId: id })
            });
            console.log('[Delete Code] Response status:', res.status);
            const data = await res.json();
            console.log('[Delete Code] Response data:', data);
            
            if (data.success) {
                // Always refresh codes regardless of selectedType
                await fetchCodes(selectedType?.id || null);
                toast.success("Code deleted successfully");
                setDeleteDialogOpen(false);
                setCodeToDelete(null);
            } else {
                toast.error(data.message || 'Failed to delete code');
            }
        } catch (error) {
            console.error("[Delete Code] Error:", error);
            toast.error(`Failed to delete code: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const openDeleteDialog = (code) => {
        setCodeToDelete(code.id);
        setDeleteDialogOpen(true);
    };

    const handleUpdateCode = async (e) => {
        e.preventDefault();
        if (!editingCode || !editingCode.code.trim()) {
            toast.error("Code cannot be empty");
            return;
        }
        setLoading(true);
        try {
            await updateDoc(doc(db, "redeem_codes", editingCode.id), {
                code: editingCode.code,
                note: editingCode.note,
                updatedAt: serverTimestamp()
            });
            setEditingCode(null);
            setEditDialogOpen(false);
            if (selectedType) fetchCodes(selectedType.id);
            toast.success(`Code updated to "${editingCode.code}"`);
        } catch (error) {
            console.error("Error updating code", error);
            toast.error(`Failed to update code: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateType = async (e) => {
        if (e) e.preventDefault();
        if (!editingType || !editingType.name.trim()) {
            toast.error("Type name cannot be empty");
            return;
        }
        setLoading(true);
        try {
            await updateDoc(doc(db, "game_types", editingType.id), {
                name: editingType.name,
                sellingPrice: parseFloat(editingType.sellingPrice) || 0,
                capitalPrice: parseFloat(editingType.capitalPrice) || 0,
                updatedAt: serverTimestamp()
            });
            setEditingType(null);
            fetchTypes();
            toast.success(`Type "${editingType.name}" updated successfully`);
        } catch (error) {
            console.error("Error updating type", error);
            toast.error(`Failed to update type: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Helper to format date
    const formatDate = (timestamp) => {
        if (!timestamp) return "-";
        return new Date(timestamp.seconds * 1000).toLocaleDateString("id-ID", {
            day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    const handleStatusChange = async (codeId, value) => {
        try {
            await updateDoc(doc(db, "redeem_codes", codeId), {
                isUsed: value === "sold", // "sold" = true, "available" = false
                updatedAt: serverTimestamp()
            });
            if (selectedType) fetchCodes(selectedType.id);
            const statusText = value === "sold" ? "Sold" : "Available";
            toast.success(`Status changed to "${statusText}"`);
        } catch (error) {
            console.error("Error updating status", error);
            toast.error(`Failed to update status: ${error.message}`);
        }
    };

    // Helper to escape CSV values properly
    const escapeCSV = (value) => {
        if (value === null || value === undefined) return "";
        const str = String(value);
        if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    };

    // Helper to format currency for CSV
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);
    };

    // Helper to format full date-time
    const formatDateTime = (timestamp) => {
        if (!timestamp) return "-";
        return new Date(timestamp.seconds * 1000).toLocaleString("id-ID", {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        });
    };

    // Export ALL Codes to detailed CSV
    const handleExportCSV = async () => {
        setLoading(true);
        try {
            // Always fetch ALL codes for export, regardless of current filter
            const allCodesSnapshot = await getDocs(query(collection(db, "redeem_codes")));
            const allCodes = allCodesSnapshot.docs
                .map(d => ({ id: d.id, ...d.data() }))
                .sort((a, b) => {
                    const timeA = a.createdAt?.seconds || 0;
                    const timeB = b.createdAt?.seconds || 0;
                    return timeB - timeA;
                });

            if (allCodes.length === 0) {
                toast.error("No codes to export");
                setLoading(false);
                return;
            }

            // Also fetch all types to ensure complete data
            const allTypesSnapshot = await getDocs(query(collection(db, "game_types")));
            const allTypes = allTypesSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));

            // Detailed CSV headers
            const headers = [
                "No",
                "Code",
                "Type",
                "Note",
                "Status",
                "Harga Modal",
                "Harga Jual",
                "Profit",
                "Tanggal Dibuat",
                "Tanggal Diupdate",
                "Type ID",
                "Code ID"
            ];

            // Build rows with full detail
            let totalSellingPrice = 0;
            let totalCapitalPrice = 0;
            let totalProfit = 0;
            let totalSold = 0;
            let totalAvailable = 0;

            const rows = allCodes.map((code, index) => {
                const type = allTypes.find(t => t.id === code.typeId);
                const typeName = type?.name || "Unknown";
                const sellingPrice = type?.sellingPrice || 0;
                const capitalPrice = type?.capitalPrice || 0;
                const profit = sellingPrice - capitalPrice;
                const status = code.isUsed ? "Sold" : "Available";
                const createdDate = formatDateTime(code.createdAt);
                const updatedDate = code.updatedAt ? formatDateTime(code.updatedAt) : "-";

                if (code.isUsed) {
                    totalSold++;
                    totalSellingPrice += sellingPrice;
                    totalCapitalPrice += capitalPrice;
                    totalProfit += profit;
                } else {
                    totalAvailable++;
                }

                return [
                    index + 1,
                    escapeCSV(code.code),
                    escapeCSV(typeName),
                    escapeCSV(code.note || "-"),
                    status,
                    capitalPrice,
                    sellingPrice,
                    profit,
                    createdDate,
                    updatedDate,
                    code.typeId,
                    code.id
                ];
            });

            // Build CSV with BOM for Excel UTF-8 support
            const BOM = "\uFEFF";
            const csvLines = [];

            // Title section
            csvLines.push(`Cloudphone Manager - Export Report`);
            csvLines.push(`Tanggal Export: ${new Date().toLocaleString("id-ID")}`);
            csvLines.push(`Total Codes: ${allCodes.length}`);
            csvLines.push(``);

            // Summary per type
            csvLines.push(`=== RINGKASAN PER TYPE ===`);
            csvLines.push(["Type", "Total", "Sold", "Available", "Harga Modal", "Harga Jual", "Profit/item", "Total Profit (Sold)"].join(","));
            allTypes.forEach(type => {
                const typeCodes = allCodes.filter(c => c.typeId === type.id);
                const sold = typeCodes.filter(c => c.isUsed).length;
                const available = typeCodes.filter(c => !c.isUsed).length;
                const profitPerItem = (type.sellingPrice || 0) - (type.capitalPrice || 0);
                const totalTypeProfit = profitPerItem * sold;
                csvLines.push([
                    escapeCSV(type.name),
                    typeCodes.length,
                    sold,
                    available,
                    formatCurrency(type.capitalPrice || 0),
                    formatCurrency(type.sellingPrice || 0),
                    formatCurrency(profitPerItem),
                    formatCurrency(totalTypeProfit)
                ].join(","));
            });
            csvLines.push(``);

            // Grand summary
            csvLines.push(`=== RINGKASAN TOTAL ===`);
            csvLines.push(`Total Semua Code,${allCodes.length}`);
            csvLines.push(`Total Sold,${totalSold}`);
            csvLines.push(`Total Available,${totalAvailable}`);
            csvLines.push(`Total Modal (Sold),${formatCurrency(totalCapitalPrice)}`);
            csvLines.push(`Total Penjualan (Sold),${formatCurrency(totalSellingPrice)}`);
            csvLines.push(`Total Profit (Sold),${formatCurrency(totalProfit)}`);
            csvLines.push(``);

            // Detail data
            csvLines.push(`=== DETAIL SEMUA CODE ===`);
            csvLines.push(headers.join(","));
            rows.forEach(row => csvLines.push(row.join(",")));

            const csvContent = BOM + csvLines.join("\n");

            // Create blob and download
            const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);

            const fileName = `cloudphone_full_report_${new Date().toISOString().split('T')[0]}.csv`;
            link.setAttribute("href", url);
            link.setAttribute("download", fileName);
            link.style.visibility = "hidden";

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            toast.success(`Exported ${allCodes.length} codes to CSV successfully`);
        } catch (error) {
            console.error("Error exporting CSV:", error);
            toast.error(`Failed to export CSV: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Calculate Stats
    const stats = {
        totalCodes: codes.length,
        totalSold: codes.filter(c => c.isUsed).length,
        profit: codes.reduce((acc, code) => {
            if (!code.isUsed) return acc;
            const type = types.find(t => t.id === code.typeId);
            const margin = (type?.sellingPrice || 0) - (type?.capitalPrice || 0);
            return acc + margin;
        }, 0)
    };

    return (
        <Flex direction="column" gap="5" style={{ height: '100%' }}>
            <Flex justify="between" align="center">
                <Heading size="8" style={{ background: "linear-gradient(to right, #fff, #a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                    Cloudphone Manager
                </Heading>
            </Flex>

            {/* Stats Cards */}
            <Grid columns={{ initial: "1", xs: "2", md: "3" }} gap="4">
                <Card>
                    <Flex direction="column" gap="1">
                        <Text size="2" color="gray">Profit</Text>
                        <Heading size="6" color="green">
                            {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(stats.profit)}
                        </Heading>
                    </Flex>
                </Card>
                <Card>
                    <Flex direction="column" gap="1">
                        <Text size="2" color="gray">Total Sold</Text>
                        <Heading size="6" color="blue">
                            {stats.totalSold} <Text size="4" color="gray" weight="regular">/ {stats.totalCodes}</Text>
                        </Heading>
                    </Flex>
                </Card>
                <Card>
                    <Flex direction="column" gap="1">
                        <Text size="2" color="gray">Available Stock</Text>
                        <Heading size="6" color="amber">
                            {stats.totalCodes - stats.totalSold}
                        </Heading>
                    </Flex>
                </Card>
            </Grid>

            <Grid columns={{ initial: "1", md: "250px 1fr" }} gap="6" style={{ flex: 1 }}>
                {/* Left Column: Game Types */}
                <Card size="2">
                    <Flex direction="column" height="100%" gap="3">
                        <Flex justify="between" align="center">
                            <Heading size="3">Type</Heading>
                            <Badge color="gray">{types.length}</Badge>
                        </Flex>

                        <Button
                            variant={selectedType === null ? "solid" : "soft"}
                            color="violet"
                            style={{ width: '100%', cursor: 'pointer' }}
                            onClick={() => handleSelectType(null)}
                        >
                            Show All Codes
                        </Button>

                        <form onSubmit={(e) => { e.preventDefault(); handleAddType(e); }}>
                            <Flex direction="column" gap="2">
                                <Flex gap="2">
                                    <TextField.Root
                                        placeholder="New Type Name..."
                                        value={newTypeName}
                                        onChange={(e) => setNewTypeName(e.target.value)}
                                        disabled={loading}
                                        style={{ flex: 2 }}
                                    />
                                </Flex>
                                <Flex gap="2">
                                    <TextField.Root
                                        placeholder="Modal (Rp)"
                                        type="number"
                                        value={newCapitalPrice}
                                        onChange={(e) => setNewCapitalPrice(e.target.value)}
                                        disabled={loading}
                                        style={{ flex: 1 }}
                                    />
                                    <TextField.Root
                                        placeholder="Jual (Rp)"
                                        type="number"
                                        value={newSellingPrice}
                                        onChange={(e) => setNewSellingPrice(e.target.value)}
                                        disabled={loading}
                                        style={{ flex: 1 }}
                                    />
                                    <IconButton
                                        type="submit"
                                        loading={loading}
                                        variant="solid"
                                        disabled={!newTypeName.trim() || loading}
                                    >
                                        <PlusIcon />
                                    </IconButton>
                                </Flex>
                            </Flex>
                        </form>

                        <Flex direction="column" gap="1" style={{ overflowY: 'auto', flex: 1, maxHeight: '600px' }}>
                            {types.map(type => (
                                <Flex
                                    key={type.id}
                                    justify="between"
                                    align="center"
                                    p="2"
                                    style={{
                                        borderRadius: 'var(--radius-2)',
                                        background: selectedType?.id === type.id ? 'var(--violet-4)' : 'transparent',
                                        cursor: 'pointer',
                                    }}
                                    onClick={() => handleSelectType(type)}
                                >
                                    <Box>
                                        <Text weight={selectedType?.id === type.id ? 'bold' : 'regular'} as="div">{type.name}</Text>
                                        <Flex gap="2">
                                            <Text size="1" color="gray">
                                                M: {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(type.capitalPrice || 0)}
                                            </Text>
                                            <Text size="1" color="green">
                                                J: {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(type.sellingPrice || 0)}
                                            </Text>
                                        </Flex>
                                    </Box>
                                    <Flex gap="2">
                                        <Dialog.Root>
                                            <Dialog.Trigger>
                                                <IconButton
                                                    size="1"
                                                    variant="ghost"
                                                    color="gray"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setEditingType(type);
                                                    }}
                                                >
                                                    <Pencil1Icon />
                                                </IconButton>
                                            </Dialog.Trigger>

                                            <Dialog.Content style={{ maxWidth: 450 }} onClick={(e) => e.stopPropagation()}>
                                                <Dialog.Title>Edit Type Collection</Dialog.Title>
                                                <Dialog.Description size="2" mb="4">
                                                    Update details for this type.
                                                </Dialog.Description>

                                                <Flex direction="column" gap="3">
                                                    <label>
                                                        <Text as="div" size="2" mb="1" weight="bold">Name</Text>
                                                        <TextField.Root
                                                            defaultValue={type.name}
                                                            placeholder="Enter new name"
                                                            onChange={(e) => setEditingType({ ...editingType, name: e.target.value })}
                                                        />
                                                    </label>
                                                    <Flex gap="2">
                                                        <label style={{ flex: 1 }}>
                                                            <Text as="div" size="2" mb="1" weight="bold">Modal (Rp)</Text>
                                                            <TextField.Root
                                                                defaultValue={type.capitalPrice}
                                                                type="number"
                                                                placeholder="0"
                                                                onChange={(e) => setEditingType({ ...editingType, capitalPrice: e.target.value })}
                                                            />
                                                        </label>
                                                        <label style={{ flex: 1 }}>
                                                            <Text as="div" size="2" mb="1" weight="bold">Jual (Rp)</Text>
                                                            <TextField.Root
                                                                defaultValue={type.sellingPrice}
                                                                type="number"
                                                                placeholder="0"
                                                                onChange={(e) => setEditingType({ ...editingType, sellingPrice: e.target.value })}
                                                            />
                                                        </label>
                                                    </Flex>
                                                </Flex>

                                                <Flex gap="3" mt="4" justify="end">
                                                    <Dialog.Close>
                                                        <Button variant="soft" color="gray" onClick={() => setEditingType(null)}>Cancel</Button>
                                                    </Dialog.Close>
                                                    <Dialog.Close>
                                                        <Button onClick={handleUpdateType}>Save</Button>
                                                    </Dialog.Close>
                                                </Flex>
                                            </Dialog.Content>
                                        </Dialog.Root>

                                        <AlertDialog.Root>
                                            <AlertDialog.Trigger>
                                                <IconButton
                                                    size="1"
                                                    variant="ghost"
                                                    color="red"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <TrashIcon />
                                                </IconButton>
                                            </AlertDialog.Trigger>
                                            <AlertDialog.Content maxWidth="450px" onClick={(e) => e.stopPropagation()}>
                                                <AlertDialog.Title>Delete Type Collection</AlertDialog.Title>
                                                <AlertDialog.Description size="2">
                                                    Are you sure? This will delete the type and potentially leave orphaned codes (if any).
                                                </AlertDialog.Description>

                                                <Flex gap="3" mt="4" justify="end">
                                                    <AlertDialog.Cancel>
                                                        <Button variant="soft" color="gray">
                                                            Cancel
                                                        </Button>
                                                    </AlertDialog.Cancel>
                                                    <AlertDialog.Action>
                                                        <Button variant="solid" color="red" onClick={() => handleDeleteType(type.id)}>
                                                            Delete
                                                        </Button>
                                                    </AlertDialog.Action>
                                                </Flex>
                                            </AlertDialog.Content>
                                        </AlertDialog.Root>
                                    </Flex>
                                </Flex>
                            ))}
                        </Flex>
                    </Flex>
                </Card>

                {/* Right Column: Codes */}
                <Card size="3" style={{ height: '100%' }}>
                    <Flex direction="column" height="100%" gap="4">
                        <Flex justify="between" align="center" gap="2">
                            <Flex align="center" gap="2" style={{ flex: 1 }}>
                                <Heading size="5">
                                    {selectedType ? `${selectedType.name} Codes` : "All Codes"}
                                </Heading>
                                <Badge color="violet">{codes.length} Codes</Badge>
                            </Flex>
                            <Button 
                                variant="soft" 
                                color="cyan"
                                onClick={handleExportCSV}
                                loading={loading}
                                style={{ whiteSpace: 'nowrap' }}
                            >
                                📥 Export All CSV
                            </Button>
                        </Flex>

                        {/* Add Code Form - Only visible when a type is selected */}
                        {selectedType ? (
                            <form onSubmit={handleAddCode}>
                                <Flex gap="3" align="start">
                                    <Box style={{ flex: 1 }}>
                                        <TextArea
                                            placeholder="Paste codes here (one per line or comma separated)"
                                            value={newCode}
                                            onChange={(e) => setNewCode(e.target.value)}
                                            disabled={loading}
                                            size="3"
                                            rows={1}
                                            style={{ minHeight: '35px', resize: 'vertical' }}
                                        />
                                    </Box>
                                    <Box style={{ flex: 2 }}>
                                        <TextField.Root
                                            placeholder="Note (e.g. 100 Robux) - Applied to all"
                                            value={newNote}
                                            onChange={(e) => setNewNote(e.target.value)}
                                            disabled={loading}
                                            size="3"
                                        />
                                    </Box>
                                    <Button type="submit" size="3" loading={loading} style={{ height: '35px' }}>Add</Button>
                                </Flex>
                            </form>
                        ) : (
                            <Callout.Root size="1" color="gray" variant="soft">
                                <Callout.Icon>
                                    <InfoCircledIcon />
                                </Callout.Icon>
                                <Callout.Text>
                                    Select a Type to add new codes. Viewing all codes below.
                                </Callout.Text>
                            </Callout.Root>
                        )}

                        {/* Codes Table */}
                        <Box style={{ flex: 1, overflow: 'auto' }}>
                            <Table.Root variant="surface">
                                <Table.Header>
                                    <Table.Row>
                                        <Table.ColumnHeaderCell>Code</Table.ColumnHeaderCell>
                                        <Table.ColumnHeaderCell>Type</Table.ColumnHeaderCell>
                                        <Table.ColumnHeaderCell>Note</Table.ColumnHeaderCell>
                                        <Table.ColumnHeaderCell>Date</Table.ColumnHeaderCell>
                                        <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
                                        <Table.ColumnHeaderCell align="right">Actions</Table.ColumnHeaderCell>
                                    </Table.Row>
                                </Table.Header>

                                <Table.Body>
                                    {codes.map((code) => {
                                        const typeName = types.find(t => t.id === code.typeId)?.name || 'Unknown';
                                        return (
                                            <Table.Row key={code.id}>
                                                <Table.Cell>
                                                    <Flex align="center" gap="2">
                                                        <Text style={{ fontFamily: 'monospace' }} color="violet" weight="bold">{code.code}</Text>
                                                        <CopyButton text={code.code} />
                                                    </Flex>
                                                </Table.Cell>
                                                <Table.Cell>
                                                    <Badge color="blue" variant="soft">{typeName}</Badge>
                                                </Table.Cell>
                                                <Table.Cell>
                                                    <Text size="2">{code.note || "-"}</Text>
                                                </Table.Cell>
                                                <Table.Cell>
                                                    <Text size="2" color="gray">{formatDate(code.createdAt)}</Text>
                                                </Table.Cell>
                                                <Table.Cell>
                                                    <Select.Root
                                                        defaultValue={code.isUsed ? "sold" : "available"}
                                                        onValueChange={(value) => handleStatusChange(code.id, value)}
                                                    >
                                                        <Select.Trigger variant="soft" color={code.isUsed ? "gray" : "green"} />
                                                        <Select.Content>
                                                            <Select.Item value="available">Available</Select.Item>
                                                            <Select.Item value="sold">Sold</Select.Item>
                                                        </Select.Content>
                                                    </Select.Root>
                                                </Table.Cell>
                                                <Table.Cell align="right">
                                                    <Flex gap="2" justify="end">
                                                        <Dialog.Root open={editDialogOpen && editingCode?.id === code.id} onOpenChange={(open) => {
                                                                setEditDialogOpen(open);
                                                                if (open) setEditingCode(code);
                                                                else setEditingCode(null);
                                                            }}>
                                                            <Dialog.Trigger>
                                                                <IconButton variant="soft" color="gray">
                                                                    <Pencil1Icon />
                                                                </IconButton>
                                                            </Dialog.Trigger>

                                                            <Dialog.Content style={{ maxWidth: 450 }}>
                                                                <Dialog.Title>Edit Code</Dialog.Title>
                                                                <Dialog.Description size="2" mb="4">
                                                                    Update code details.
                                                                </Dialog.Description>

                                                                <Flex direction="column" gap="3">
                                                                    <label>
                                                                        <Text as="div" size="2" mb="1" weight="bold">Code</Text>
                                                                        <TextField.Root
                                                                            defaultValue={code.code}
                                                                            placeholder="Enter code"
                                                                            onChange={(e) => setEditingCode({ ...code, code: e.target.value })}
                                                                        />
                                                                    </label>
                                                                    <label>
                                                                        <Text as="div" size="2" mb="1" weight="bold">Note</Text>
                                                                        <TextField.Root
                                                                            defaultValue={code.note}
                                                                            placeholder="Enter note (optional)"
                                                                            onChange={(e) => setEditingCode({ ...code, note: e.target.value })}
                                                                        />
                                                                    </label>
                                                                </Flex>

                                                                <Flex gap="3" mt="4" justify="end">
                                                                    <Button variant="soft" color="gray" onClick={() => {
                                                                        setEditingCode(null);
                                                                        setEditDialogOpen(false);
                                                                    }}>
                                                                        Cancel
                                                                    </Button>
                                                                    <Button onClick={handleUpdateCode} loading={loading} disabled={loading}>
                                                                        Save
                                                                    </Button>
                                                                </Flex>
                                                            </Dialog.Content>
                                                        </Dialog.Root>

                                                        <IconButton 
                                                            variant="soft" 
                                                            color="red"
                                                            onClick={() => openDeleteDialog(code)}
                                                        >
                                                            <TrashIcon />
                                                        </IconButton>
                                                    </Flex>
                                                </Table.Cell>
                                            </Table.Row>
                                        );
                                    })}
                                    {codes.length === 0 && (
                                        <Table.Row>
                                            <Table.Cell colSpan={6} align="center">
                                                <Text color="gray" size="2" style={{ padding: '2rem' }}>No codes available.</Text>
                                            </Table.Cell>
                                        </Table.Row>
                                    )}
                                </Table.Body>
                            </Table.Root>
                        </Box>
                    </Flex>
                </Card>
            </Grid>

            {/* Global Delete Confirmation Dialog */}
            <AlertDialog.Root open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialog.Content maxWidth="450px">
                    <AlertDialog.Title>Delete Code</AlertDialog.Title>
                    <AlertDialog.Description size="2">
                        Are you sure you want to delete this code? This action cannot be undone.
                    </AlertDialog.Description>

                    <Flex gap="3" mt="4" justify="end">
                        <AlertDialog.Cancel>
                            <Button variant="soft" color="gray" onClick={() => setCodeToDelete(null)}>
                                Cancel
                            </Button>
                        </AlertDialog.Cancel>
                        <AlertDialog.Action>
                            <Button 
                                variant="solid" 
                                color="red" 
                                onClick={() => handleDeleteCode()}
                                disabled={loading}
                            >
                                {loading ? "Deleting..." : "Delete"}
                            </Button>
                        </AlertDialog.Action>
                    </Flex>
                </AlertDialog.Content>
            </AlertDialog.Root>
        </Flex>
    );
}

function CopyButton({ text }) {
    const [copied, setCopied] = useState(false);

    const onClick = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        toast.success("Code copied to clipboard!");
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <IconButton size="1" variant="ghost" color={copied ? "green" : "gray"} onClick={onClick}>
            {copied ? <CheckIcon /> : <CopyIcon />}
        </IconButton>
    );
}
