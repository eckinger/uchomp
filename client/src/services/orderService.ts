export default class OrderService {
  construtor() {}
  async getOrders() {
    fetch("http://localhost:5151/api/orders")
      .then((res) => res.json())
      .then((data) => console.log(`data: ${JSON.stringify(data)}`));
  }
}
