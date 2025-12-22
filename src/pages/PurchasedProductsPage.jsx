import React from "react";
import ColorInit from "../helper/ColorInit";
import ScrollToTop from "react-scroll-to-top";
import Preloader from "../helper/Preloader";
import HeaderTwo from "../components/HeaderTwo";
import Breadcrumb from "../components/Breadcrumb";
// import WishListSection from "../components/WishListSection";
import PurchasedProductsSection from "../components/PurchasedProductsSection";
import ShippingOne from "../components/ShippingOne";
import FooterTwo from "../components/FooterTwo";
import BottomFooter from "../components/BottomFooter";

function PurchasedProductsPage() {
  return (
    <>
      {/* ColorInit */}
      <ColorInit color={true} />

      {/* ScrollToTop */}
      <ScrollToTop smooth color='#FA6400' />

      {/* Preloader */}
      <Preloader />

      {/* HeaderTwo */}
      <HeaderTwo category={true} />

      {/* Breadcrumb */}
      <Breadcrumb title={"Purchased Products"} />

      {/* PurchasedProductsSection */}
      <PurchasedProductsSection />

      {/* ShippingOne */}
      <ShippingOne />

      {/* FooterTwo */}
      <FooterTwo />

      {/* BottomFooter */}
      <BottomFooter />
    </>
  );
}

export default PurchasedProductsPage;
