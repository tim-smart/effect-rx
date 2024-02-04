# @effect-rx/rx

## 0.25.1

### Patch Changes

- [`63f1727`](https://github.com/tim-smart/effect-rx/commit/63f172702d13909f61892465939db63af4f7c763) Thanks [@tim-smart](https://github.com/tim-smart)! - add keepAlive to layer rx's

## 0.25.0

### Minor Changes

- [`3448c4a`](https://github.com/tim-smart/effect-rx/commit/3448c4abca718d5c87a50da9c189e90e7f4f76b4) Thanks [@tim-smart](https://github.com/tim-smart)! - add Rx.runtime api

  Instead of creating a RuntimeRx by using Rx.make, it is now done explicitly
  using the Rx.runtime api.

  ```ts
  const runtimeRx = Rx.runtime(MyLayer);
  ```

  It also exposes a .layer rx, which can be used to inject test layers:

  ```ts
  const registry = Registry.make({
    initialValues: [Rx.initialValue(runtimeRx.layer, MyTestLayer)],
  });

  // .. inject registry into react context etc
  ```

## 0.24.1

### Patch Changes

- [`c7612e2`](https://github.com/tim-smart/effect-rx/commit/c7612e2ded6a1f62e1637bb62e41047b52d6949e) Thanks [@tim-smart](https://github.com/tim-smart)! - don't treat Option and Either as effects

## 0.24.0

### Minor Changes

- [`04e8432`](https://github.com/tim-smart/effect-rx/commit/04e8432f3e681f443d4365914241b3b68b31340e) Thanks [@tim-smart](https://github.com/tim-smart)! - update effect

## 0.23.0

### Minor Changes

- [`edcdb24`](https://github.com/tim-smart/effect-rx/commit/edcdb2439c29f89f63c66a2898244441724b1860) Thanks [@tim-smart](https://github.com/tim-smart)! - update effect

## 0.22.1

### Patch Changes

- [`db67bde`](https://github.com/tim-smart/effect-rx/commit/db67bde230f873458b1a8b3436aed6f1f7668a44) Thanks [@tim-smart](https://github.com/tim-smart)! - add stream apis to context

## 0.22.0

### Minor Changes

- [#94](https://github.com/tim-smart/effect-rx/pull/94) [`08e2b53`](https://github.com/tim-smart/effect-rx/commit/08e2b5307af266bdad50d17331cc9b1e8194f278) Thanks [@fubhy](https://github.com/fubhy)! - Updated `effect` dependencies

## 0.21.0

### Minor Changes

- [`67e75f8`](https://github.com/tim-smart/effect-rx/commit/67e75f8716636887dd2464f1c6119aff61edeefa) Thanks [@tim-smart](https://github.com/tim-smart)! - update effect

## 0.20.0

### Minor Changes

- [`704b836`](https://github.com/tim-smart/effect-rx/commit/704b836a5641df7c216b41b715dbd04c998609ef) Thanks [@tim-smart](https://github.com/tim-smart)! - update effect

## 0.19.0

### Minor Changes

- [`70500de`](https://github.com/tim-smart/effect-rx/commit/70500de54fb5c4c3665311dd0fedfe92c7c54bda) Thanks [@tim-smart](https://github.com/tim-smart)! - update effect

## 0.18.3

### Patch Changes

- [`e8734bc`](https://github.com/tim-smart/effect-rx/commit/e8734bc4cb525daaccd318f4e22f4ef04cd8383b) Thanks [@tim-smart](https://github.com/tim-smart)! - wrap defaultContext with globalValue

## 0.18.2

### Patch Changes

- [`693d845`](https://github.com/tim-smart/effect-rx/commit/693d8457b1f5ecc0b5d83c5b932437ce328c4a0d) Thanks [@tim-smart](https://github.com/tim-smart)! - add defaultContext and Rx.make(layer)

## 0.18.1

### Patch Changes

- [`a642c93`](https://github.com/tim-smart/effect-rx/commit/a642c939cf82b65b0cd1af55b490d45ebbd33b31) Thanks [@tim-smart](https://github.com/tim-smart)! - allow Rx.family to return anything

- [`e4da41a`](https://github.com/tim-smart/effect-rx/commit/e4da41a70b991ec170bd585b3ea4dc0e6a571b50) Thanks [@tim-smart](https://github.com/tim-smart)! - default fn arg type to void

## 0.18.0

### Minor Changes

- [`a15e989`](https://github.com/tim-smart/effect-rx/commit/a15e9893460c996975787a8fe1228ecd1a9d22a9) Thanks [@tim-smart](https://github.com/tim-smart)! - add Rx.context api for building layers

## 0.17.0

### Minor Changes

- [#83](https://github.com/tim-smart/effect-rx/pull/83) [`1c3808b`](https://github.com/tim-smart/effect-rx/commit/1c3808b428fabab0b91855b0ee196d2b29b65f64) Thanks [@tim-smart](https://github.com/tim-smart)! - update effect

## 0.16.1

### Patch Changes

- [`50139fc`](https://github.com/tim-smart/effect-rx/commit/50139fc91b12adb38a7207ca0d4fa939cb255349) Thanks [@tim-smart](https://github.com/tim-smart)! - update effect

## 0.16.0

### Minor Changes

- [`f3d415a`](https://github.com/tim-smart/effect-rx/commit/f3d415a33c18cdb72c813ae361dd94a16975b1fe) Thanks [@tim-smart](https://github.com/tim-smart)! - update effect

## 0.15.1

### Patch Changes

- [`3abf01a`](https://github.com/tim-smart/effect-rx/commit/3abf01a83ed1ee1606a9e4cbd967670d00a3d2dd) Thanks [@tim-smart](https://github.com/tim-smart)! - fix non-objects

## 0.15.0

### Minor Changes

- [#78](https://github.com/tim-smart/effect-rx/pull/78) [`c7dfc46`](https://github.com/tim-smart/effect-rx/commit/c7dfc468c3407f67e4d73cebbd77ae67ef10f25e) Thanks [@tim-smart](https://github.com/tim-smart)! - consolidate Rx constructors

## 0.14.0

### Minor Changes

- [`82edca4`](https://github.com/tim-smart/effect-rx/commit/82edca47888ccf5222626bb887108bdde13c4945) Thanks [@tim-smart](https://github.com/tim-smart)! - update effect

## 0.13.0

### Minor Changes

- [`073796e`](https://github.com/tim-smart/effect-rx/commit/073796e7ed050307fde039d6f8290a65b25f7491) Thanks [@tim-smart](https://github.com/tim-smart)! - update effect

## 0.12.0

### Minor Changes

- [`b00fa8d`](https://github.com/tim-smart/effect-rx/commit/b00fa8d6cf06c0eeda5587f549ad712d2d7cbc58) Thanks [@tim-smart](https://github.com/tim-smart)! - allow context in Rx.runtime

- [#74](https://github.com/tim-smart/effect-rx/pull/74) [`1495465`](https://github.com/tim-smart/effect-rx/commit/14954655c21d2e63c17e24068776ef42d194b17a) Thanks [@tim-smart](https://github.com/tim-smart)! - remove Result.Waiting state

## 0.11.3

### Patch Changes

- [`3a97ec2`](https://github.com/tim-smart/effect-rx/commit/3a97ec2643c1c246c508b5a6313875ec5e4a61be) Thanks [@tim-smart](https://github.com/tim-smart)! - add previousValue to result failure

## 0.11.2

### Patch Changes

- [`77e19f5`](https://github.com/tim-smart/effect-rx/commit/77e19f55da6d0e491708db1b4f73798ba4a2e7a4) Thanks [@tim-smart](https://github.com/tim-smart)! - break up Result waiting states

## 0.11.1

### Patch Changes

- [`33aa01d`](https://github.com/tim-smart/effect-rx/commit/33aa01db58ac6b7cf0aca8ce82dbe63528b2ddc6) Thanks [@tim-smart](https://github.com/tim-smart)! - update effect

## 0.11.0

### Minor Changes

- [`7fa070b`](https://github.com/tim-smart/effect-rx/commit/7fa070b7cf8c4627e28318fc652ce13e19492ef9) Thanks [@tim-smart](https://github.com/tim-smart)! - update effect

## 0.10.1

### Patch Changes

- [`7bd7a1a`](https://github.com/tim-smart/effect-rx/commit/7bd7a1a4446ff633d9841f7a40a183d466414b32) Thanks [@tim-smart](https://github.com/tim-smart)! - update effect

## 0.10.0

### Minor Changes

- [`47c7af7`](https://github.com/tim-smart/effect-rx/commit/47c7af758603eb150b40029724fbb126964ae8ad) Thanks [@tim-smart](https://github.com/tim-smart)! - update effect

### Patch Changes

- [`aa3e481`](https://github.com/tim-smart/effect-rx/commit/aa3e4810f9f0ad866fd53ec35f09c8f9c36faf79) Thanks [@tim-smart](https://github.com/tim-smart)! - add withFallback api

## 0.9.2

### Patch Changes

- [`29800d5`](https://github.com/tim-smart/effect-rx/commit/29800d5d3543222b93a7c9966a4fd4bde0c34273) Thanks [@tim-smart](https://github.com/tim-smart)! - fix runtime type extends check

## 0.9.1

### Patch Changes

- [`5f5450a`](https://github.com/tim-smart/effect-rx/commit/5f5450afda92ffc98cbc3a9dc96dccfbe110d178) Thanks [@tim-smart](https://github.com/tim-smart)! - add initialValue options

## 0.9.0

### Minor Changes

- [`2bb0eae`](https://github.com/tim-smart/effect-rx/commit/2bb0eae545a47a368e655893f80a1a153bc756c9) Thanks [@tim-smart](https://github.com/tim-smart)! - update effect

## 0.8.0

### Minor Changes

- [#63](https://github.com/tim-smart/effect-rx/pull/63) [`8e09f3d`](https://github.com/tim-smart/effect-rx/commit/8e09f3d227bdb7f3ff3d8c4f6f234bf3040a987d) Thanks [@tim-smart](https://github.com/tim-smart)! - update effect

## 0.7.2

### Patch Changes

- [`bb9c0f2`](https://github.com/tim-smart/effect-rx/commit/bb9c0f24258c6073439d5b817e137a61ae75ca41) Thanks [@tim-smart](https://github.com/tim-smart)! - add idleTTL for non-keepAlive Rx's

## 0.7.1

### Patch Changes

- [`37aa2c0`](https://github.com/tim-smart/effect-rx/commit/37aa2c0162229a1ee967645ee48fd3a7a9e891a1) Thanks [@tim-smart](https://github.com/tim-smart)! - add RxRef.prop

## 0.7.0

### Minor Changes

- [`7e62588`](https://github.com/tim-smart/effect-rx/commit/7e62588b4ea919afdccfc96d29e59719d193eb57) Thanks [@tim-smart](https://github.com/tim-smart)! - update effect

## 0.6.0

### Minor Changes

- [#57](https://github.com/tim-smart/effect-rx/pull/57) [`ed9b125`](https://github.com/tim-smart/effect-rx/commit/ed9b12552997a62db699bad80d2ec8a53ab4c358) Thanks [@tim-smart](https://github.com/tim-smart)! - update effect

## 0.5.2

### Patch Changes

- [`34a2d12`](https://github.com/tim-smart/effect-rx/commit/34a2d124050fe08ff097171e4f1d0e88b09a1dcb) Thanks [@tim-smart](https://github.com/tim-smart)! - fix for hermes

## 0.5.1

### Patch Changes

- [`120408c`](https://github.com/tim-smart/effect-rx/commit/120408ca45d997e14104807cba8ead94333f3479) Thanks [@tim-smart](https://github.com/tim-smart)! - update effect

## 0.5.0

### Minor Changes

- [`417ada2`](https://github.com/tim-smart/effect-rx/commit/417ada29ec65d34a378834613f0e84db4dca24eb) Thanks [@tim-smart](https://github.com/tim-smart)! - add preconstruct

## 0.4.1

### Patch Changes

- [`dbfeeba`](https://github.com/tim-smart/effect-rx/commit/dbfeeba12522415ed132996a11a9e3a6e44bb6fb) Thanks [@tim-smart](https://github.com/tim-smart)! - update effect

## 0.4.0

### Minor Changes

- [`4e93d76`](https://github.com/tim-smart/effect-rx/commit/4e93d76a5804599805ff7652113d0b7e38288b8e) Thanks [@tim-smart](https://github.com/tim-smart)! - update to effect package

## 0.3.2

### Patch Changes

- [`aa23958`](https://github.com/tim-smart/effect-rx/commit/aa23958ae7180ebde11b544b39a9c6e4ac865f33) Thanks [@tim-smart](https://github.com/tim-smart)! - add useRxSubscribe hook

## 0.3.1

### Patch Changes

- [`6f7d960`](https://github.com/tim-smart/effect-rx/commit/6f7d9602d5d83a1651f1df5a9df2d8edb4956bbf) Thanks [@tim-smart](https://github.com/tim-smart)! - add .mount(rx) to context

## 0.3.0

### Minor Changes

- [`5beb982`](https://github.com/tim-smart/effect-rx/commit/5beb98296e99724ed3b28cf3c2bfdc25155cda77) Thanks [@tim-smart](https://github.com/tim-smart)! - update dependencies

## 0.2.6

### Patch Changes

- [`4e173d5`](https://github.com/tim-smart/effect-rx/commit/4e173d5a727b19ffb0312b966fdee905814c344c) Thanks [@tim-smart](https://github.com/tim-smart)! - fix \*Fn not running for constant return values

## 0.2.5

### Patch Changes

- [`3346b20`](https://github.com/tim-smart/effect-rx/commit/3346b200ab2a3f3563f2b382186ea93ba8d28d0c) Thanks [@tim-smart](https://github.com/tim-smart)! - try run effects synchronously

## 0.2.4

### Patch Changes

- [`0b3f2c5`](https://github.com/tim-smart/effect-rx/commit/0b3f2c5e19e134f3f45f123923598309ee2797ea) Thanks [@tim-smart](https://github.com/tim-smart)! - add passthrough equality to RxRef

## 0.2.3

### Patch Changes

- [`8251c02`](https://github.com/tim-smart/effect-rx/commit/8251c02ef58a7cf151f0ebf65c81643587370db8) Thanks [@tim-smart](https://github.com/tim-smart)! - fix refresh chaining

## 0.2.2

### Patch Changes

- [`a53ffad`](https://github.com/tim-smart/effect-rx/commit/a53ffad1f640bdcbda08bd9543e1d467e767c064) Thanks [@tim-smart](https://github.com/tim-smart)! - fix default refresh for .map\*

## 0.2.1

### Patch Changes

- [`faa6915`](https://github.com/tim-smart/effect-rx/commit/faa6915fee0ac1b41572618f23941b59ffc14f5a) Thanks [@tim-smart](https://github.com/tim-smart)! - make Result Pipeable

## 0.2.0

### Minor Changes

- [`04058c5`](https://github.com/tim-smart/effect-rx/commit/04058c5bf5fc70d2328509967bfbcc4178a60cc2) Thanks [@tim-smart](https://github.com/tim-smart)! - add Effect apis to Rx.Context

## 0.1.25

### Patch Changes

- [`2b58bfc`](https://github.com/tim-smart/effect-rx/commit/2b58bfc0df56384c7bd54ea4b7996d559e9f9366) Thanks [@tim-smart](https://github.com/tim-smart)! - make effect/stream creation lazy

## 0.1.24

### Patch Changes

- [`d91eaca`](https://github.com/tim-smart/effect-rx/commit/d91eacade3066576a694f4bf49b9e9ba5a16aad6) Thanks [@tim-smart](https://github.com/tim-smart)! - support runtimes without WeakRef

## 0.1.23

### Patch Changes

- [`414f882`](https://github.com/tim-smart/effect-rx/commit/414f882d83f1720998faae4f6610c58cad5d52e4) Thanks [@tim-smart](https://github.com/tim-smart)! - add FinalizationRegistry polyfill

## 0.1.22

### Patch Changes

- [`53d565e`](https://github.com/tim-smart/effect-rx/commit/53d565e1a1a3dc373d197d97b6ad31d9dad7fb9d) Thanks [@tim-smart](https://github.com/tim-smart)! - improve map api types to work with Writable

## 0.1.21

### Patch Changes

- [`a2c19f4`](https://github.com/tim-smart/effect-rx/commit/a2c19f4b61775b5476818d9fd87a9c88349d0d51) Thanks [@tim-smart](https://github.com/tim-smart)! - add RxRef Collection.toArray

## 0.1.20

### Patch Changes

- [`0a67bdd`](https://github.com/tim-smart/effect-rx/commit/0a67bddc0755151f72cd309490a1c3c03559fb0d) Thanks [@tim-smart](https://github.com/tim-smart)! - add map apis

## 0.1.19

### Patch Changes

- [`902835e`](https://github.com/tim-smart/effect-rx/commit/902835ee4957b325357b3970e284a6a22f497a9c) Thanks [@tim-smart](https://github.com/tim-smart)! - prevent use of context after dispose

## 0.1.18

### Patch Changes

- [`bcad9a7`](https://github.com/tim-smart/effect-rx/commit/bcad9a71a0f5caa6f3eadf9d56e2a6db64ae547a) Thanks [@tim-smart](https://github.com/tim-smart)! - add support for injecting initial values

## 0.1.17

### Patch Changes

- [`4045106`](https://github.com/tim-smart/effect-rx/commit/40451061518c2dc96d5c52265945283afd2395df) Thanks [@tim-smart](https://github.com/tim-smart)! - Rx.runtime keepAlive by default

- [`22164a2`](https://github.com/tim-smart/effect-rx/commit/22164a218a1bf404af72c326bec260e0c01a528f) Thanks [@tim-smart](https://github.com/tim-smart)! - refactor context apis

## 0.1.16

### Patch Changes

- [`bccb5c0`](https://github.com/tim-smart/effect-rx/commit/bccb5c07709f0dfdbbe92dc034f0ece6406c4280) Thanks [@tim-smart](https://github.com/tim-smart)! - add done boolean to streamPull result

## 0.1.15

### Patch Changes

- [`54b12e7`](https://github.com/tim-smart/effect-rx/commit/54b12e7e6f1bb0ec32e4428a426b3a0a509f848c) Thanks [@tim-smart](https://github.com/tim-smart)! - fix for interrupts

## 0.1.14

### Patch Changes

- [#15](https://github.com/tim-smart/effect-rx/pull/15) [`c5b58d9`](https://github.com/tim-smart/effect-rx/commit/c5b58d957f863fe27214af57762221ccea3ffc4d) Thanks [@tim-smart](https://github.com/tim-smart)! - Rx.batch api

## 0.1.13

### Patch Changes

- [#16](https://github.com/tim-smart/effect-rx/pull/16) [`35e6392`](https://github.com/tim-smart/effect-rx/commit/35e6392c7ef128739cc901741429ffa2340b5427) Thanks [@tim-smart](https://github.com/tim-smart)! - add Rx.streamFn constructor

## 0.1.12

### Patch Changes

- [`7726b27`](https://github.com/tim-smart/effect-rx/commit/7726b270b52e60cea958b1de4ce2a62a38549a9d) Thanks [@tim-smart](https://github.com/tim-smart)! - api cleanup

## 0.1.11

### Patch Changes

- [`789701c`](https://github.com/tim-smart/effect-rx/commit/789701c28b9a9e4dcee0651d3e637ab9b99258b6) Thanks [@tim-smart](https://github.com/tim-smart)! - fix Writable typo

## 0.1.10

### Patch Changes

- [`a5692a9`](https://github.com/tim-smart/effect-rx/commit/a5692a9d53fc4779f7a5b362b8cc20c1238e7278) Thanks [@tim-smart](https://github.com/tim-smart)! - debug labels

## 0.1.9

### Patch Changes

- [`d64c8d0`](https://github.com/tim-smart/effect-rx/commit/d64c8d0f9504b44098c0198c1f01a4ead25c3af3) Thanks [@tim-smart](https://github.com/tim-smart)! - remove rx context via Effect context

- [`d64c8d0`](https://github.com/tim-smart/effect-rx/commit/d64c8d0f9504b44098c0198c1f01a4ead25c3af3) Thanks [@tim-smart](https://github.com/tim-smart)! - add Context.getResult

## 0.1.8

### Patch Changes

- [`c8d1905`](https://github.com/tim-smart/effect-rx/commit/c8d19058ddaa542f7a36037093f15db60cca74ca) Thanks [@tim-smart](https://github.com/tim-smart)! - Rx.family

## 0.1.7

### Patch Changes

- [`5b3b31e`](https://github.com/tim-smart/effect-rx/commit/5b3b31e73b402e634e03d1d13b228ac1413ee671) Thanks [@tim-smart](https://github.com/tim-smart)! - fix Stream signatures

## 0.1.6

### Patch Changes

- [`015d833`](https://github.com/tim-smart/effect-rx/commit/015d833c7f8765d63369cfa0b661b7448e702b49) Thanks [@tim-smart](https://github.com/tim-smart)! - Rx.stream & Rx.streamPull

## 0.1.5

### Patch Changes

- [`d5e5e03`](https://github.com/tim-smart/effect-rx/commit/d5e5e03d1309aead228cdb4e56e5083a7b11ef42) Thanks [@tim-smart](https://github.com/tim-smart)! - add function constructors

## 0.1.4

### Patch Changes

- [`9419ca3`](https://github.com/tim-smart/effect-rx/commit/9419ca3b03a08663a7e6b17a49cbf7b4548408a7) Thanks [@tim-smart](https://github.com/tim-smart)! - add subscribeGetter

## 0.1.3

### Patch Changes

- [`878bfba`](https://github.com/tim-smart/effect-rx/commit/878bfbae4875a7b5002847e831e3d9e5a7dbc353) Thanks [@tim-smart](https://github.com/tim-smart)! - fix react store & remove some apis

## 0.1.2

### Patch Changes

- [`ac91b78`](https://github.com/tim-smart/effect-rx/commit/ac91b78e5acabf3b13e01e6e53f7e56b269fa040) Thanks [@tim-smart](https://github.com/tim-smart)! - fix useRxValue

## 0.1.1

### Patch Changes

- [`c6d5ecd`](https://github.com/tim-smart/effect-rx/commit/c6d5ecdff4522489c959de78ad3905571ec443f2) Thanks [@tim-smart](https://github.com/tim-smart)! - restructure react package

## 0.1.0

### Minor Changes

- [`6d2fdf2`](https://github.com/tim-smart/effect-rx/commit/6d2fdf273b8990310a319b578ecdcd01d5b12cee) Thanks [@tim-smart](https://github.com/tim-smart)! - initial release
