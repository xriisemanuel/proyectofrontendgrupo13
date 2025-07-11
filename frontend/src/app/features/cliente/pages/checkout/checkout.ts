import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CartService, CartItem } from '../../../../core/services/cart.service';
import { ToastrService } from 'ngx-toastr';
import { HttpClient } from '@angular/common/http';
import { API_BASE_URL } from '../../../../core/constants/constants';
import { PedidoService } from '../../../../data/services/pedido';
import { IPedidoPayload } from '../../../../shared/pedido.interface';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css'
})
export class CheckoutComponent implements OnInit {
  checkoutForm: FormGroup;
  cartItems: CartItem[] = [];
  cartTotal: number = 0;
  isSubmitting = false;
  metodoPagoOptions = [
    'Efectivo',
    'Mercado Pago',
    'Transferencia'
  ];

  constructor(
    private fb: FormBuilder,
    private cartService: CartService,
    private router: Router,
    private toastr: ToastrService,
    private pedidoService: PedidoService
  ) {
    this.checkoutForm = this.fb.group({
      direccionEntrega: ['', Validators.required],
      metodoPago: ['', Validators.required],
      observaciones: ['']
    });
  }

  ngOnInit(): void {
    this.cartService.getCartItems().subscribe(items => {
      this.cartItems = items;
    });
    this.cartService.getCartTotal().subscribe(total => {
      this.cartTotal = total;
    });
  }

  submitPedido(): void {
    if (this.checkoutForm.invalid || this.cartItems.length === 0) {
      this.toastr.error('Completa todos los campos requeridos y asegúrate de tener productos en el carrito.', 'Error');
      return;
    }
    this.isSubmitting = true;
    const formValue = this.checkoutForm.value;
    const pedidoPayload: IPedidoPayload = {
      direccionEntrega: formValue.direccionEntrega,
      metodoPago: formValue.metodoPago,
      observaciones: formValue.observaciones,
      detalleProductos: this.cartItems.map(item => ({
        productoId: item.product._id,
        nombreProducto: item.product.nombre,
        cantidad: item.quantity,
        precioUnitario: item.product.precio || item.product.precioCombo || item.product.precioFinal || 0
      }))
    };
    this.pedidoService.createPedido(pedidoPayload).subscribe({
      next: (res: any) => {
        this.toastr.success('Pedido realizado con éxito', '¡Gracias!');
        this.cartService.clearCart();
        this.router.navigate(['/home']);
      },
      error: (err) => {
        if (err.status === 401 || err.status === 403) {
          this.toastr.error('Debes iniciar sesión como cliente para realizar un pedido.', 'Acceso denegado');
          this.router.navigate(['/login']);
        } else {
          this.toastr.error('Error al realizar el pedido', 'Error');
        }
        this.isSubmitting = false;
      }
    });
  }
} 