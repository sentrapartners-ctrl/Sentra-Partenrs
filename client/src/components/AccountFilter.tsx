import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";

interface AccountFilterProps {
  value: number | "all";
  onChange: (value: number | "all") => void;
}

export function AccountFilter({ value, onChange }: AccountFilterProps) {
  const { data: accounts } = trpc.accounts.list.useQuery();

  return (
    <Select
      value={value.toString()}
      onValueChange={(val) => onChange(val === "all" ? "all" : parseInt(val))}
    >
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Selecione uma conta" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Todas as contas</SelectItem>
        {accounts?.map((account) => (
          <SelectItem key={account.id} value={account.id.toString()}>
            {account.accountNumber} - {account.broker}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

