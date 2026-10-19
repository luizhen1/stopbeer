import Swal from "sweetalert2";

const errorPattern = /falha|não foi possível|inválid|sem permissão|bloqueou/i;

export function showToast(message, icon) {
  return Swal.fire({
    toast: true,
    position: "top-end",
    icon: icon || (errorPattern.test(message) ? "error" : "success"),
    title: message,
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
  });
}
