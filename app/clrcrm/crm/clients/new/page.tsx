import ClientForm from "../../ClientForm";

export default function NewClientPage() {
  return (
    <div className="crm-page">
      <div className="crm-page-head"><h1>Add lead</h1></div>
      <ClientForm />
    </div>
  );
}
